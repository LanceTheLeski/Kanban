using ArcStrides.API.Models.Board;
using ArcStrides.API.Models.Event.BoardTrigger;

namespace ArcStrides.API.Models.Event.BoardTrigger.CriteriaExtensions
{
    public class BoardCriteria : Criteria
    {
        public CardPosition Template { get; set; }

        public Dictionary<string, bool?> RelevantFields { get; set; }//null if field is not revelant at all, true if field has to match the value in the template exactly, false if the trigger is not dependant on the template matching

        public void methodForTesting ()
        {
            var boardFields = Template.GetType ().GetProperties ().ToList ();
        }
    }
}