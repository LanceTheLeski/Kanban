using Kanban.API.Options;
using Kanban.API.Repositories;

var builder = WebApplication.CreateBuilder (args);

builder.Services.AddTransient<IBoardRepository, BoardRepository>();
builder.Services.AddTransient<IColumnRepository, ColumnRepository> ();
builder.Services.AddTransient<ISwimlaneRepository, SwimlaneRepository> (); 
builder.Services.AddTransient<ICardRepository, CardRepository> ();

builder.Services.AddControllers()
                .AddNewtonsoftJson ();

builder.Services.AddAntiforgery ();
builder.Services.AddHttpClient ();

builder.Services.Configure<CosmosOptions> (builder.Configuration.GetSection ("Cosmos"));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
};

app.UseHttpsRedirection ();
app.UseAuthorization ();
app.UseRouting ();
app.MapControllers ();
app.MapControllerRoute 
(
	name: "default",
	pattern: "{controller=Board}/{action=GetBoard}"
);

app.UseAntiforgery ();

app.Run ();