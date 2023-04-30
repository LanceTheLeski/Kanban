using Kanban.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.Controllers
{
    [ApiController]
    [Route ("kanban/cards")]
    public class CardController : ControllerBase
    {
        [HttpGet ("getcard")]
        public ActionResult GetCard ()
        {
            //todo
            return StatusCode (StatusCodes.Status200OK, new Card ());
        }

        [HttpPost ("createcard")]
        public ActionResult CreateCard ()
        {
            //todo
            return StatusCode (StatusCodes.Status418ImATeapot);
        }
    }
}