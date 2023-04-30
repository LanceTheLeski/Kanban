using Microsoft.AspNetCore.Mvc;

namespace Kanban.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastClassController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastClassController> _logger;

        public WeatherForecastClassController(ILogger<WeatherForecastClassController> logger)
        {
            _logger = logger;
        }

        [HttpGet(Name = "GetWeatherForecasTest")]
        public IEnumerable<WeatherForecastObject> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecastObject
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }
    }
}