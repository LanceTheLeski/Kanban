using ArcStrides.Contracts.Response;
using ArcStrides.UI.Mappers;
using ArcStrides.UI.Models.Calendar;
using MudBlazor;
using System.Collections.ObjectModel;

namespace ArcStrides.UI.Layouts.Calendar;

public partial class CalendarLayout
{
    private ICollection<Date> GetAllBasicMonthDatesFromSystem (int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth (year, month);

        var mapper = new DateMapper (); // This can likely be moved later

        var dateCollection = new Collection<Date> ();
        for (var dayIndex = 1; dayIndex <= daysInMonth; dayIndex++)
        {
            var date = mapper.MapDateTimeToDate (new DateTime (year, month, dayIndex));
            dateCollection.Add (date);
        }

        return dateCollection;
    }

    private double [] CountBoardTypes (IEnumerable<CardResponse> cards)
    {
        var cardsDistinctByType = cards.Select (card => card.Position.BoardID)
                                       .Distinct ();

        var cardCounts = new double [cardsDistinctByType.Count ()];
        for (var cardCountIndex = 0; cardCountIndex < cardCounts.Length; cardCountIndex++)
            cardCounts [cardCountIndex] = cards.Where (card => card.Position.BoardID == cardsDistinctByType.ElementAt (cardCountIndex))
                                               .Count ();

        return cardCounts;
    }

    private List<ChartSeries> GetBoardTypeData (IEnumerable<CardResponse> cards)
    {
        var boardTypesList = cards.Select (card => card.Position.BoardID)
                                  .Distinct ();

        var cardsCompletedList = new List<ChartSeries> ();
        foreach (var boardType in boardTypesList)
        {
            var tasksCompleted = new double [boardTypesList.Count ()];
            for (var tasksIndex = 0; tasksIndex < tasksCompleted.Length; tasksIndex++)
                tasksCompleted [tasksIndex] = cards.Where (card => card.Position.BoardID == boardTypesList.ElementAt (tasksIndex))
                                                   .Select (card => card.Tasks.Where (task => task.IsComplete == true))
                                                   .Count ();

            cardsCompletedList.Add (new ChartSeries { Data = tasksCompleted });
        }

        return cardsCompletedList;
    }
}