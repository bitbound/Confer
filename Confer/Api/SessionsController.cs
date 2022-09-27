using Confer.Models;
using Confer.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Confer.Api
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("OpenPolicy")]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionManager _sessionManager;
        private readonly ILogger<SessionsController> _logger;

        public SessionsController(ISessionManager sessionManager, ILogger<SessionsController> logger)
        {
            _sessionManager = sessionManager;
            _logger = logger;
        }

        [HttpPost]
        public ActionResult<SessionDto> Post([FromBody]SessionDto session)
        {
            session.Id = _sessionManager.CreateNewSession(session);

            return Ok(session);
        }
    }
}
