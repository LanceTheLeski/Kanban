using RecurrenceCalculator;

namespace Kanban.Models.Board.CardExtensions
{
    public class Deadline
    {
        public DeadlineType Type { get; set; }

        public DateTime EligeabilityStart { get; set; }
        
        public DateTime EligeabilityEnd { get; set; }

        public DateTime ExpiredStart { get; set; }

        public DateTime ExpiredEnd { get; set; }

        public DateTime PreferredStart { get; set; }

        public DateTime PreferredEnd { get; set; }

        public Recurrence? Recurrence { get; set; }



        public bool IsPastDue { get; set; }
    }
}