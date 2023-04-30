using Microsoft.AspNetCore.Mvc;

namespace Kanban.Controllers
{
    [ApiController]
    [Route ("kanban")]
    public class KanbanController : ControllerBase
    {
        private readonly ILogger<KanbanController> _logger;

        public KanbanController (ILogger<KanbanController> logger)
        {
            _logger = logger;
        }

        [HttpGet ("getboard")]
        public ActionResult GetBoard ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpPost ("createboard")]
        public ActionResult CreateBoard ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpGet ("getcolumn")]
        public ActionResult GetColumn ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpPost ("createcolumn")]
        public ActionResult CreateColumn ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpGet ("getswimlane")]
        public ActionResult GetSwimlane ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpPost ("createswimlane")]
        public ActionResult CreateSwimlane ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpGet ("getcard")]
        public ActionResult GetCard ()
        {
            //todo
            return StatusCode (418);
        }

        [HttpPost ("createcard")]
        public ActionResult CreateCard ()
        {
            //todo
            return StatusCode (418);
        }
    }
}