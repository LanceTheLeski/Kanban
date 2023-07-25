namespace Kanban.Models.Triggers.CriteriaExtensions
{
    public class BoardCriteria : Criteria
    {
        public Board.Board Template { get; set; }

        public Dictionary<string, bool?> RelevantFields { get; set; }//null if field is not revelant at all, true if field has to match the value in the template exactly, false if the trigger is not dependant on the template matching

        public void methodForTesting ()
        {
            var boardFields = Template.GetType ().GetProperties ().ToList ();
        }
    }
}