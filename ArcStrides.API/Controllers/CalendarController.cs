using ArcStrides.API.Calendars.Mappers;
using ArcStrides.API.Mappers;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Models.Calendar;
using ArcStrides.API.Models.Tag;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using ArcStrides.API.Calendars.Validators;
using ArcStrides.API.Messages;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/calendars")]
public class CalendarController : Controller
{
    private readonly IDateRepository _dateRepository;
    private readonly ITagRepository _tagRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly ITimelineRepository _timelineRepository;

    private readonly DateMapper _dateMapper;
    private readonly CardMapper _cardMapper;
    private readonly TaskMapper _taskMapper;
    private readonly TimelineMapper _timelineMapper;

    /// <summary>
    /// TagTypeID for a tag whose parent is a card — see TagRepository.ParentExistsAsync.
    /// </summary>
    private const int CardTagTypeID = 3;

    public CalendarController (IDateRepository dateRepository,
                               ITagRepository tagRepository,
                               ICardRepository cardRepository,
                               ITaskRepository taskRepository,
                               ITimelineRepository timelineRepository,
                               DateMapper dateMapper,
                               CardMapper cardMapper,
                               TaskMapper taskMapper,
                               TimelineMapper timelineMapper)
    {
        _dateRepository = dateRepository;
        _tagRepository = tagRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
        _timelineRepository = timelineRepository;

        _dateMapper = dateMapper;
        _cardMapper = cardMapper;
        _taskMapper = taskMapper;
        _timelineMapper = timelineMapper;
    }

    [HttpGet ("months/{ID:guid}")]
    public async Task<ActionResult> FetchMonth (Guid ID)
    {
        var dates = await _dateRepository.QueryDatesAsync (date => date.RowKey == ID.ToString ());

        var first = dates.FirstOrDefault ();
        var title = first is null ? null : $"{first.MonthName} {first.Year}";

        return Ok (await BuildMonthResponseAsync (dates, ID, title));
    }

    /// <summary>
    /// The stored days of a calendar month, found by the month itself rather than
    /// by an ID — <c>GET months?year=2026&amp;month=9</c>.
    /// </summary>
    /// <remarks>
    /// <paramref name="month"/> runs 1–12, the way a person writes it. The table's
    /// MonthOrder runs 0–11; the conversion happens here and nowhere else.
    ///
    /// A month nobody has put anything on has no rows, and that is not an error:
    /// the answer is 200 with no dates and no ID. The UI draws the month from the
    /// calendar either way and lays whatever is stored on top.
    ///
    /// Rows are matched on Year and MonthOrder, not on the month ID, so every day
    /// of the month comes back even if its rows were written under two IDs — which
    /// two first-ever writes to one month at the same moment could do. The ID
    /// reported is the one most of them share.
    /// </remarks>
    [HttpGet ("months")]
    public async Task<ActionResult> FindMonth ([FromQuery] int year, [FromQuery] int month)
    {
        if (IsCalendarMonth (year, month) is false)
            return BadRequest ($"There is no month {month} of year {year}. Month runs 1-12.");

        var dates = await QueryMonthAsync (year, month);

        return Ok (await BuildMonthResponseAsync (dates, MonthIDOf (dates), TitleOf (year, month)));
    }

    /// <summary>
    /// Puts a card on a calendar date — <c>POST dates/2026/9/24/cards</c>.
    /// </summary>
    /// <remarks>
    /// Nothing has to exist first. A month is only the days that have been
    /// written for it, so the first card on a day writes that day's row, and the
    /// first day of a month is where the month's ID comes from. That is what lets
    /// the UI show every month without storing any of them.
    ///
    /// The card is linked the way FetchMonth reads it: the day's CardTagGroupID
    /// names a tag group, one TagGroups row per tag in it, and each tag's RowKey is
    /// a card. Written tag first, then the group row that makes it visible, so a
    /// failure part-way leaves an unreachable tag rather than a group row pointing
    /// at nothing.
    ///
    /// Putting a card on a day it is already on is not an error; nothing is
    /// written. Answers with the whole month, so the caller can replace what it
    /// holds without a second request.
    /// </remarks>
    [HttpPost ("dates/{year:int}/{month:int}/{day:int}/cards")]
    public async Task<ActionResult> AddCardToDate (int year, int month, int day, [FromBody] DateCardCreateRequest dateCardCreateRequest)
    {
        var validationResult = new DateValidators.DateCardCreateRequestValidator ().Validate (dateCardCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (DateCardCreateRequest), validationResult.ToString ()));

        if (IsCalendarDate (year, month, day) is false)
            return BadRequest ($"{year}-{month}-{day} is not a date on the calendar.");

        var cardID = dateCardCreateRequest.CardID!.Value.ToString ();
        var card = (await _cardRepository.QueryCardsAsync (card => card.RowKey == cardID)).FirstOrDefault ();
        if (card is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Card)));

        var monthDates = await QueryMonthAsync (year, month);
        var date = DayOf (monthDates, day);
        if (date is null)
        {
            date = NewDate (year, month, day, MonthIDOf (monthDates) ?? Guid.NewGuid ());
            await _dateRepository.AddDateAsync (date);
        }

        // The day's group is made with its first card; a day with nothing on it
        // still has Guid.Empty here, as CreateDate writes it.
        if (date.CardTagGroupID == Guid.Empty)
        {
            date.CardTagGroupID = Guid.NewGuid ();
            await _dateRepository.UpdateDateAsync (date);
        }

        var alreadyOnDay = (await TagsOnDayAsync (date)).Any (pair => pair.Tag.RowKey == cardID);
        if (alreadyOnDay is false)
        {
            var tagID = Guid.NewGuid ().ToString ();
            await _tagRepository.AddTagAsync (new Tag
            {
                PartitionKey = tagID,
                RowKey = cardID,
                ParentObjectTypeName = nameof (Card),
                Title = card.Title,
                TagTypeID = CardTagTypeID,
            });
            await _tagRepository.AddTagGroupAsync (new TagGroup
            {
                PartitionKey = date.CardTagGroupID.ToString (),
                RowKey = tagID,
                Title = $"{date.MonthName} {date.DateOrder}, {date.Year}",
                TagGroupTypeID = 0,
            });
        }

        var updated = await QueryMonthAsync (year, month);
        return StatusCode (StatusCodes.Status201Created, await BuildMonthResponseAsync (updated, MonthIDOf (updated), TitleOf (year, month)));
    }

    /// <summary>
    /// Takes a card off a calendar date — <c>DELETE dates/2026/9/24/cards/{cardID}</c>.
    /// </summary>
    /// <remarks>
    /// Removes the tag and its group row. The day's own row stays, with its now
    /// empty group, ready for the next card; the card itself is not touched.
    /// Answers with the whole month, as AddCardToDate does.
    /// </remarks>
    [HttpDelete ("dates/{year:int}/{month:int}/{day:int}/cards/{cardID:guid}")]
    public async Task<ActionResult> RemoveCardFromDate (int year, int month, int day, Guid cardID)
    {
        if (IsCalendarDate (year, month, day) is false)
            return BadRequest ($"{year}-{month}-{day} is not a date on the calendar.");

        var monthDates = await QueryMonthAsync (year, month);

        var removed = 0;
        foreach (var date in monthDates.Where (date => date.DateOrder == day))
            foreach (var pair in (await TagsOnDayAsync (date)).Where (pair => pair.Tag.RowKey == cardID.ToString ()))
            {
                await _tagRepository.DeleteTagGroupAsync (pair.GroupRow);
                await _tagRepository.DeleteTagAsync (pair.Tag);
                removed += 1;
            }

        if (removed is 0)
            return NotFound ("That card is not on that date.");

        var updated = await QueryMonthAsync (year, month);
        return Ok (await BuildMonthResponseAsync (updated, MonthIDOf (updated), TitleOf (year, month)));
    }

    /// <summary>
    /// The month as the UI reads it: each stored day, with the cards on it and
    /// their tasks. Shared by every endpoint here that answers with a month.
    /// </summary>
    private async Task<MonthResponse> BuildMonthResponseAsync (IEnumerable<Date> dates, Guid? monthID, string? title)
    {
        //I like to think that a really nice JOIN will be the solution to this one day :)
        var tagGroupIDsForMonth = dates.Select (date => date.CardTagGroupID.ToString ());
        var tagGroupsForMonth = new List<TagGroup> ();
        foreach (var tagGroupID in tagGroupIDsForMonth)
            tagGroupsForMonth.AddRange (await _tagRepository.QueryTagGroupsAsync (tagGroup => tagGroup.PartitionKey == tagGroupID));//This could very well break

        var tagIDsForMonth = tagGroupsForMonth.Select (tagGroup => tagGroup.RowKey.ToString ());
        var tagsForMonth = new List<Tag> ();
        foreach (var tagID in tagIDsForMonth)
            tagsForMonth.AddRange (await _tagRepository.QueryTagsAsync (tag => tag.PartitionKey == tagID));

        // Distinct: a card tagged onto two days of the month has two tags, and
        // without this it was read twice, its position was read twice, and the
        // SingleOrDefault below threw on the pair — a 500 for the whole month.
        var cardIDsForMonth = tagsForMonth.Select (tag => tag.RowKey.ToString ()).Distinct ();
        var cardsForMonth = new List<Card> ();
        foreach (var cardID in cardIDsForMonth)
            cardsForMonth.AddRange (await _cardRepository.QueryCardsAsync (card => card.RowKey == cardID));

        var cardPositionsForMonth = new List<CardPosition> ();
        foreach (var card in cardsForMonth)
            cardPositionsForMonth.AddRange (await _cardRepository.QueryCardPositionsAsync (cardPosition => cardPosition.RowKey == card.CardPositionID.ToString()));

        // Read once for the month, and only when there is a card to use them.
        var timelines = cardsForMonth.Count is 0
            ? []
            : await _timelineRepository.QueryTimelinesAsync (timeline => true);

        var dateList = new List<DateResponse> ();
        foreach (var date in dates)
        {
            var tagIDsForDay = tagGroupsForMonth.Where (tagGroup => tagGroup.PartitionKey == date.CardTagGroupID.ToString ())
                                                .Select (tagGroup => tagGroup.RowKey);
            var cardIDsForDay = tagsForMonth.Where ((Func<Tag, bool>) (tag => Enumerable.Contains<string> (tagIDsForDay, tag.PartitionKey)))
                                            .Select <Tag, string> (tagGroup => tagGroup.RowKey);
            var cardsForDay = cardsForMonth.Where (card => cardIDsForDay.Contains (card.RowKey));

            var cardResponses = new List<CardResponse> ();
            foreach (var card in cardsForDay) 
            {
                // A card with no position has been deleted from its board: the
                // delete removes the position and keeps the card row (see
                // docs/api-gaps.md, #3), and the day's tag still points at it.
                // Mapping a null position threw, which took the whole month
                // down with it. It is not on a board any more, so it is not on
                // the calendar either.
                var cardPositionRow = cardPositionsForMonth.SingleOrDefault (cardPosition => cardPosition.RowKey == card.CardPositionID.ToString ());
                if (cardPositionRow is null)
                    continue;

                var tasks = await _taskRepository.QueryTasksAsync (task => task.CardID == Guid.Parse(card.RowKey));
                var taskTypes = await _taskRepository.QueryTaskTypesAsync (taskType => taskType.PartitionKey == card.PartitionKey);

                var taskResponseList = new List<TaskResponse> ();
                foreach (var task in tasks.ToList ())
                {
                    var taskResponse = _taskMapper.MapTaskToTaskResponse (task);
                    var taskType = taskTypes.SingleOrDefault (taskType => int.Parse (taskType.RowKey) == task.TaskTypeID);
                    if (taskType is not null)
                        taskResponse.TaskType = _taskMapper.MapTaskTypeToTaskTypeResponse (taskType);

                    // Matched on ParentObjectID, the way BoardController does and
                    // for the reason it gives: nothing writes Task.TimelineID.
                    // Without this every task reached the calendar with an empty
                    // timeline, and a day's deadlines could never be listed.
                    var taskTimeline = timelines.SingleOrDefault (timeline => timeline.ParentObjectID.ToString () == task.RowKey);
                    if (taskTimeline is not null)
                        taskResponse.Timeline = _timelineMapper.MapTimelineToTimelineResponse (taskTimeline);

                    taskResponseList.Add (taskResponse);
                }

                var cardResponse = _cardMapper.MapCardToCardResponse (card);
                cardResponse.Tasks = taskResponseList;

                var cardPosition = _cardMapper.MapCardPositionToCardPositionResponse (cardPositionRow);
                cardResponse.Position = cardPosition;

                cardResponses.Add (cardResponse);
            }

            var dateResponse = _dateMapper.MapDateToDateResponse (date);
            dateResponse.Cards = cardResponses;

            dateList.Add (dateResponse);
        }
        return new MonthResponse
        {
            ID = monthID,
            Title = title,
            Dates = dateList,
        };
    }

    [HttpPost ("months")]
    public async Task<ActionResult> CreateMonth ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPost ("months/{monthID:guid}/dates")]
    public async Task<ActionResult> CreateDate ([FromRoute] Guid monthID, [FromBody] DateCreateRequest dateCreateRequest)
    {
        if (dateCreateRequest is null)
        {
            return BadRequest ("There was no Date Request passed in!");
        }

        //Validation for correct month later..

        var newDateID = Guid.NewGuid ();
        var newDate = new Date
        {
            PartitionKey = newDateID.ToString (),
            RowKey = monthID.ToString (),

            DateOrder = dateCreateRequest.DateOrder.Value,
            WeekOrder = dateCreateRequest.WeekOrder.Value,
            DayOfTheWeekOrder = dateCreateRequest.DayOfTheWeekOrder.Value,
            MonthOrder = dateCreateRequest.MonthOrder.Value,
            MonthName = dateCreateRequest.MonthName,
            Year = dateCreateRequest.Year.Value,

            CardTagGroupID = Guid.Empty
        };

        await _dateRepository.AddDateAsync (newDate);
        /*if (addDateResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the date so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new date into database. Internal status: {addDateResponse.Status}");
        }*/
        /*var dateResponse = new DateResponse
        {
            ID = Guid.Parse(newDate.PartitionKey),

            DateOrder = newDate.DateOrder,
            WeekOrder = newDate.WeekOrder,
            DayOfTheWeekOrder = newDate.DayOfTheWeekOrder,

            Cards = new List<CardResponse> ()
        };*/

        var mapper = new DateMapper ();
        var dateResponse = mapper.MapDateToDateResponse (newDate);

        return StatusCode (StatusCodes.Status201Created, dateResponse);
    }

    [HttpPatch ("months/{monthID:guid}/dates/{dateID:guid}")]
    public async Task<ActionResult> UpdateDate (Guid dateID, Guid monthID, [FromBody] JsonPatchDocument<DatePatchRequest> datePatchRequest)
    {
        if (datePatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var dateFromTable = await _dateRepository.GetDateAsync (dateID: dateID, monthID: monthID);
        if (dateFromTable is null)
            return BadRequest ("The date you want to update does not exist!");
        
        var dateToUpdate = dateFromTable!;
        var convertedDateToUpdate = new DatePatchRequest
        {
            DateOrder = dateToUpdate.DateOrder,
            WeekOrder = dateToUpdate.WeekOrder,
            DayOfTheWeekOrder = dateToUpdate.DayOfTheWeekOrder,
            MonthOrder = dateToUpdate.MonthOrder,
            MonthName = dateToUpdate.MonthName,
            Year = dateToUpdate.Year
        };

        datePatchRequest.ApplyTo (convertedDateToUpdate); //Could add a ModelState validation somewhere here as well..

        dateToUpdate.DateOrder = convertedDateToUpdate.DateOrder.Value;
        dateToUpdate.WeekOrder = convertedDateToUpdate.WeekOrder.Value;
        dateToUpdate.DayOfTheWeekOrder = convertedDateToUpdate.DayOfTheWeekOrder.Value;
        dateToUpdate.MonthOrder = convertedDateToUpdate.MonthOrder.Value;
        dateToUpdate.MonthName = convertedDateToUpdate.MonthName;
        dateToUpdate.Year = convertedDateToUpdate.Year.Value;

        await _dateRepository.UpdateDateAsync (dateToUpdate);
        /*if (response.IsError)
        {
            return BadRequest ($"Could not update date. Internal status: {response.Status}");
        }*/

        /*var dateResponse = new DateResponse
        {
            ID = Guid.Parse(dateToUpdate.PartitionKey),
            DateOrder = dateToUpdate.DateOrder,
            WeekOrder = dateToUpdate.WeekOrder,
            DayOfTheWeekOrder = dateToUpdate.DayOfTheWeekOrder,
            Cards = new List<CardResponse> ()
        };*/

        var mapper = new DateMapper ();
        var dateResponse = mapper.MapDateToDateResponse (dateToUpdate);

        return Ok (dateResponse);
    }

    [HttpDelete ("dates/{ID:guid}")]
    public async Task<ActionResult> DeleteDate (Guid ID)
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    // ── Calendar helpers ─────────────────────────────────────────────────────

    private static bool IsCalendarMonth (int year, int month)
        => year is >= 1 and <= 9999 && month is >= 1 and <= 12;

    private static bool IsCalendarDate (int year, int month, int day)
        => IsCalendarMonth (year, month) && day >= 1 && day <= DateTime.DaysInMonth (year, month);

    private static string TitleOf (int year, int month)
        => new DateTime (year, month, 1).ToString ("MMMM yyyy", CultureInfo.InvariantCulture);

    /// <summary>Every stored day of a month, whatever month ID it was written under.</summary>
    private async Task<IReadOnlyList<Date>> QueryMonthAsync (int year, int month)
    {
        var monthOrder = month - 1;
        return await _dateRepository.QueryDatesAsync (date => date.Year == year && date.MonthOrder == monthOrder);
    }

    /// <summary>The month ID most of these days share, or null when there are none.</summary>
    private static Guid? MonthIDOf (IEnumerable<Date> dates)
        => dates.GroupBy (date => date.RowKey)
                .OrderByDescending (group => group.Count ())
                .Select (group => (Guid?) Guid.Parse (group.Key))
                .FirstOrDefault ();

    /// <summary>
    /// A day's row. If two were written for it, the one that already has cards,
    /// then the one under the month's main ID.
    /// </summary>
    private static Date? DayOf (IReadOnlyList<Date> monthDates, int day)
    {
        var monthID = MonthIDOf (monthDates)?.ToString ();
        return monthDates.Where (date => date.DateOrder == day)
                         .OrderByDescending (date => date.CardTagGroupID != Guid.Empty)
                         .ThenByDescending (date => date.RowKey == monthID)
                         .FirstOrDefault ();
    }

    /// <summary>
    /// A new row for a day, with every field worked out from the date itself —
    /// the caller supplies which day, not facts about it that could disagree.
    /// </summary>
    private static Date NewDate (int year, int month, int day, Guid monthID)
    {
        var calendarDate = new DateTime (year, month, day);
        var firstWeekday = (int) new DateTime (year, month, 1).DayOfWeek;

        return new Date
        {
            PartitionKey = Guid.NewGuid ().ToString (),
            RowKey = monthID.ToString (),

            DateOrder = day,
            WeekOrder = (day - 1 + firstWeekday) / 7,
            DayOfTheWeekOrder = (int) calendarDate.DayOfWeek,
            MonthOrder = month - 1,
            MonthName = calendarDate.ToString ("MMMM", CultureInfo.InvariantCulture),
            Year = year,

            CardTagGroupID = Guid.Empty
        };
    }

    /// <summary>The tags in a day's group, each with the group row that holds it.</summary>
    private async Task<List<(TagGroup GroupRow, Tag Tag)>> TagsOnDayAsync (Date date)
    {
        var pairs = new List<(TagGroup, Tag)> ();
        if (date.CardTagGroupID == Guid.Empty)
            return pairs;

        var groupID = date.CardTagGroupID.ToString ();
        foreach (var groupRow in await _tagRepository.QueryTagGroupsAsync (tagGroup => tagGroup.PartitionKey == groupID))
            foreach (var tag in await _tagRepository.GetTagsAsync (Guid.Parse (groupRow.RowKey)))
                pairs.Add ((groupRow, tag));

        return pairs;
    }
}