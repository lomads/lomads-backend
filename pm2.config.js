module.exports = {
    apps : [{
      "name"        : "lomads-dao-apis",
      "script"      : "index.js",
      "node_args"   : "",
      "instances"   : "1",
      "exec_mode"   : "cluster",
      "time"        : true,
      "error_file"  : '/home/ubuntu/logs/lomads-dao--apis-logs-err.log',
      "out_file"    : '/home/ubuntu/logs/lomads-dao-apis-logs-out.log',
      "merge_logs"  : true,
      "env_production" : {
        "NODE_ENV": "production",
        "JWT_SECRET": "sjgljhghjglhjglrc",
        "PORT": "8080",
        "MONGO_HOST": "mongodb+srv://lomads-dao:L0mads@321@cluster0.kkgl3yd.mongodb.net/Lomads-dao?retryWrites=true&w=majority"
      },
      "env_development" : {
        "NODE_ENV": "production",
        "JWT_SECRET": "sjgljhghjglhjglrc",
        "PORT": "8080",
        "MONGO_HOST": "mongodb+srv://lomads-dao:L0mads@321@cluster0.kkgl3yd.mongodb.net/Lomads-dao?retryWrites=true&w=majority",
        "AWS_REGION": "eu-west-3",
        "S3_BUCKET_URL": 'https://lomads-dao-development.s3.eu-west-3.amazonaws.com/',
        "S3_BUCKET":"lomads-dao-development"
      }
    }],
  }
  