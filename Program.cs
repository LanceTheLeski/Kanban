using Kanban.Components;
using Kanban.Contexts;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder (args);

// Add services to the container.
builder.Services.AddRazorComponents ()
                .AddInteractiveServerComponents ();

builder.Services.AddMudServices ();

//builder.Services.AddControllers();
builder.Services.AddControllersWithViews();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer ();
//builder.Services.AddCors ();
builder.Services.AddSwaggerGen ();

builder.Services.Configure<CosmosOptions> (builder.Configuration.GetSection ("Cosmos"));

var app = builder.Build();

app.Services.GetRequiredService<IConfiguration> ();

//app.UseCors ();
if (!app.Environment.IsDevelopment())
{
	app.UseExceptionHandler("/Kanban/Error");
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
};

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment ())
{
    app.UseSwagger ();
    app.UseSwaggerUI ();
}

app.UseHttpsRedirection ();
app.UseAuthorization ();
app.UseStaticFiles();
app.UseRouting();
app.MapControllers ();
app.MapControllerRoute(
	name: "default",
	pattern: "{controller=Board}/{action=GetBoard}");

app.UseAntiforgery ();

app.MapRazorComponents<App> ()
   .AddInteractiveServerRenderMode ();

app.Run ();