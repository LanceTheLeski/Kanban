using Kanban.Components;
using Kanban.Contexts;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder (args);

// Add services to the container.
builder.Services.AddRazorComponents ()
                .AddInteractiveServerComponents ();

builder.Services.AddMudServices ();

builder.Services.AddControllers()
				.AddNewtonsoftJson ();
builder.Services.AddControllersWithViews();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer ();//I think Swagger can be removed soon
//builder.Services.AddCors ();
builder.Services.AddHttpClient ();

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

app.UseHttpsRedirection ();
app.UseAuthorization ();
app.UseStaticFiles();
app.UseRouting();
app.MapControllers ();
app.MapControllerRoute(
	name: "default",
	pattern: "{controller=Board}/{action=GetBoard}");//This needs to be adjust for Blazor soon

app.UseAntiforgery ();

app.MapRazorComponents<App> ()
   .AddInteractiveServerRenderMode ();

app.Run ();