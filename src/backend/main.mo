actor {
  type AppConfig = {
    name : Text;
    author : Text;
    version : Text;
    description : Text;
  };

  let config : AppConfig = {
    name = "Video Optimizer";
    author = "Open Source OpenFPL Contributors";
    version = "0.1.0";
    description = "App for optimizing and compressing videos";
  };

  public query ({ caller }) func isHealthy() : async Bool {
    true;
  };

  public query ({ caller }) func getConfig() : async AppConfig {
    config;
  };
};
