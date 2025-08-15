using ArcStrides.UI.Mappers;
using ArcStrides.UI.Models.Board;
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
            
            date.Labels = new string [0];
            date.DonutChartData = new double [0];
            
            date.xAxisLabels = new string [0];
            date.LineChartData = new List<ChartSeries> ();

            dateCollection.Add (date);
        }

        return dateCollection;
    }

    private double [] CountTasksForEachBoardType (IEnumerable<Card> cards)
    {
        var cardsDistinctByType = cards.Select (card => card.BoardID)
                                       .Distinct ();

        var cardCounts = new double [cardsDistinctByType.Count ()];
        for (var cardCountIndex = 0; cardCountIndex < cardCounts.Length; cardCountIndex++)
            cardCounts [cardCountIndex] = cards.Where (card => card.BoardID == cardsDistinctByType.ElementAt (cardCountIndex))
                                               .SelectMany (card => card.Tasks)
                                               .Count ();

        return cardCounts;
    }

    private List<ChartSeries> GetFormattedBoardTypeData (IEnumerable<Card> cards)
    {
        var boardTypesList = cards?.Select (card => card.BoardID)
                                  ?.Distinct ()
                                  ?? [];

        var cardsCompletedList = new List<ChartSeries> ();

        foreach (var boardType in boardTypesList)
        {
            var tasksCompleted = new double [6];
            for (var tasksIndex = 0; tasksIndex < tasksCompleted.Length - 2; tasksIndex ++)
            {
                var completedTasks = cards?.Where (card => card.BoardID == boardType)
                                          ?.SelectMany (card => card.Tasks.Where (task => task.IsCompleted == true))
                                          ?.Count ()
                                          ?? 0;
                var totalTasks = cards?.Where (card => card.BoardID == boardType)
                                      ?.SelectMany (card => card.Tasks)
                                      ?.Count ()
                                      ?? 10;

                tasksCompleted [tasksIndex + 2] = ((double) completedTasks / totalTasks) * 10;
            }

            tasksCompleted [0] = 0;
            tasksCompleted [1] = 0;

            cardsCompletedList.Add (new ChartSeries { Data = tasksCompleted });
        }

        cardsCompletedList.Add (new ChartSeries { Data = [ 10, 10, 10, 10, 10, 10 ], Visible = false });

        return cardsCompletedList;
    }
}