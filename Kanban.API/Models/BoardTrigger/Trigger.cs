namespace Kanban.API.Models.BoardTrigger
{
    public class Trigger
    {
        public int Id { get; set; }

        public TriggerType Cause { get; set; }

        public IEnumerable<Criteria> CauseCriteriaOptions { get; set; }//Different criteria options that can be met

        public TriggerType Effect { get; set; }

        public IEnumerable<Criteria> EffectCriteriaToApply { get; set; }//All effects that are applied when the cause is met

        public IEnumerable<Guid> ActionLocationIds { get; set; }

    }
}