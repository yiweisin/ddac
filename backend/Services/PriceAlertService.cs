using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;

namespace backend.Services
{
    public class PriceAlertService : BackgroundService
    {
        private readonly ILogger<PriceAlertService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(5);

        public PriceAlertService(
            ILogger<PriceAlertService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Price Alert Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Checking price alerts at: {time}", DateTimeOffset.Now);
                
                try
                {
                    await CheckPriceAlertsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while checking price alerts.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Price Alert Service is stopping.");
        }
         private async Task CheckPriceAlertsAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();
                
                // Get all non-triggered alerts
                var alerts = await dbContext.PriceAlerts
                    .Include(a => a.Stock)
                    .Include(a => a.User)
                    .Where(a => !a.IsTriggered)
                    .ToListAsync();
                
                foreach (var alert in alerts)
                {
                    if (alert.Stock == null || alert.User == null)
                    {
                        continue;
                    }
                    
                    bool shouldTrigger = false;
                    
                    // Check if the alert should be triggered
                    if (alert.IsAboveTarget && alert.Stock.Price >= alert.TargetPrice)
                    {
                        shouldTrigger = true;
                    }
                    else if (!alert.IsAboveTarget && alert.Stock.Price <= alert.TargetPrice)
                    {
                        shouldTrigger = true;
                    }
                    
                    if (shouldTrigger)
                    {
                        // Mark the alert as triggered
                        alert.IsTriggered = true;
                        dbContext.Entry(alert).State = EntityState.Modified;
                        await dbContext.SaveChangesAsync();
                        
                        // Send notification if user has enabled notifications
                        if (alert.User.EmailNotificationsEnabled || alert.User.SmsNotificationsEnabled)
                        {
                            string direction = alert.IsAboveTarget ? "risen above" : "fallen below";
                            string message = $"Price Alert: {alert.Stock.Symbol} has {direction} your target price of ${alert.TargetPrice}. Current price: ${alert.Stock.Price}.";
                            string subject = $"Price Alert: {alert.Stock.Symbol} ${alert.Stock.Price}";
                            
                            await notificationService.PublishMessageAsync(message, subject);
                            
                            _logger.LogInformation("Price alert triggered and notification sent for {stock} at {price}", 
                                alert.Stock.Symbol, alert.Stock.Price);
                        }
                    }
                }
            }
        }
    }
}