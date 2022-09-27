using Confer.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var services = builder.Services;

services.AddCors(options =>
{
    options.AddPolicy("OpenPolicy", builder => builder
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod()
    );
});

services.AddControllersWithViews();
services.AddRazorPages();

services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});

// In production, the React files will be served from this directory
services.AddSpaStaticFiles(configuration =>
{
    configuration.RootPath = "ClientApp/build";
});

services.AddSingleton<ISessionManager, SessionManager>();
services.AddScoped<IAppSettings, AppSettings>();


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseSpaStaticFiles();

app.UseRouting();

app.UseCors("OpenPolicy");
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<SignalingHub>("/signaling");
    endpoints.MapControllers();
    endpoints.MapRazorPages();
});

app.UseSpa(spa =>
{
    spa.Options.SourcePath = "ClientApp";

    if (app.Environment.IsDevelopment())
    {
        spa.UseReactDevelopmentServer(npmScript: "start");
    }
});

await app.RunAsync();