const edge = require('edge-js');
const path = require('path');
const fs = require('fs');

/**
 * Crystal Reports Generator using Edge.js
 */
class CrystalReportsGenerator {
  constructor() {
    // Path to your .rpt file
    this.reportsPath = path.join(__dirname, '..', 'crystal_reports');
    this.outputPath = path.join(__dirname, '..', 'reports');

    // Ensure directories exist
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Generate PDF using Crystal Reports
   * @param {string} reportName - Name of the .rpt file (without extension)
   * @param {object} parameters - Report parameters
   * @param {string} outputFileName - Output PDF filename
   */
  async generateReport(reportName, parameters, outputFileName) {
    return new Promise((resolve, reject) => {
      const generatePDF = edge.func(`
        #r "CrystalDecisions.CrystalReports.Engine.dll"
        #r "CrystalDecisions.ReportAppServer.ClientDoc.dll"
        #r "CrystalDecisions.Shared.dll"
        
        using System;
        using System.Threading.Tasks;
        using CrystalDecisions.CrystalReports.Engine;
        using CrystalDecisions.Shared;
        
        public class Startup
        {
            public async Task<object> Invoke(dynamic input)
            {
                try
                {
                    string reportPath = input.reportPath;
                    string outputPath = input.outputPath;
                    
                    // Load Crystal Report
                    ReportDocument reportDocument = new ReportDocument();
                    reportDocument.Load(reportPath);
                    
                    // Set database connection (if needed)
                    if (input.connectionString != null)
                    {
                        ConnectionInfo connectionInfo = new ConnectionInfo();
                        connectionInfo.ServerName = input.serverName;
                        connectionInfo.DatabaseName = input.databaseName;
                        connectionInfo.UserID = input.userId;
                        connectionInfo.Password = input.password;
                        
                        TableLogOnInfos logOnInfos = reportDocument.Database.TableLogOnInfos;
                        foreach (TableLogOnInfo logOnInfo in logOnInfos)
                        {
                            logOnInfo.ConnectionInfo = connectionInfo;
                            logOnInfo.TableLocation.ApplyLogOnInfo(logOnInfo);
                        }
                    }
                    
                    // Set report parameters
                    if (input.parameters != null)
                    {
                        foreach (var param in input.parameters)
                        {
                            reportDocument.SetParameterValue(param.Key, param.Value);
                        }
                    }
                    
                    // Export to PDF
                    reportDocument.ExportToDisk(ExportFormatType.PortableDocFormat, outputPath);
                    reportDocument.Close();
                    reportDocument.Dispose();
                    
                    return new { success = true, path = outputPath };
                }
                catch (Exception ex)
                {
                    return new { success = false, error = ex.Message, stack = ex.StackTrace };
                }
            }
        }
      `);

      const reportPath = path.join(this.reportsPath, `${reportName}.rpt`);
      const outputFilePath = path.join(this.outputPath, outputFileName);

      // Check if report file exists
      if (!fs.existsSync(reportPath)) {
        return reject(new Error(`Report file not found: ${reportPath}`));
      }

      const input = {
        reportPath: reportPath,
        outputPath: outputFilePath,
        parameters: parameters,
        // Database connection (optional - use if report needs database connection)
        // serverName: 'your-oracle-server',
        // databaseName: 'your-database',
        // userId: 'your-user',
        // password: 'your-password',
      };

      generatePDF(input, (error, result) => {
        if (error) {
          console.error('Crystal Reports Error:', error);
          return reject(error);
        }

        if (!result.success) {
          console.error('Crystal Reports Generation Failed:', result.error);
          return reject(new Error(result.error));
        }

        console.log('✅ Crystal Report generated:', result.path);
        resolve(result.path);
      });
    });
  }
}

module.exports = new CrystalReportsGenerator();