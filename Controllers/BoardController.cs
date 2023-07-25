using Kanban.Models.Board;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.Controllers
{
    [ApiController]
    [Route ("kanban/boards")]
    public class BoardController : ControllerBase
    {
        [HttpGet ("getboard")]
        public ActionResult GetBoard ()
        {
            //todo
            return StatusCode (StatusCodes.Status200OK, new Board ());
        }

        [HttpPost ("createboard")]
        public ActionResult CreateBoard ()
        {
            //todo
            return StatusCode (StatusCodes.Status418ImATeapot);
        }

        [HttpGet ("getcolumn")]
        public ActionResult GetColumn ()
        {
            //todo
            return StatusCode (StatusCodes.Status200OK, new Column ());
        }

        [HttpPost ("createcolumn")]
        public ActionResult CreateColumn ()
        {
            //todo
            return StatusCode (StatusCodes.Status418ImATeapot);
        }

        [HttpGet ("getswimlane")]
        public ActionResult GetSwimlane ()
        {
            //todo
            return StatusCode (StatusCodes.Status200OK, new Swimlane ());
        }

        [HttpPost ("createswimlane")]
        public ActionResult CreateSwimlane ()
        {
            //todo
            return StatusCode (StatusCodes.Status418ImATeapot);
        }
    }
}