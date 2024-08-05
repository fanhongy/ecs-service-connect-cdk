# ECS Service connect with CDK sample. 

## Deploy: 
```cdk deploy```

## Description:
We have three services here: `Nginx` `Service-a` and `Service-b`. Nginx service is exposed via an Application Load Balancer, it has configuration like below: 
```nginx.conf
events {}

http {

    upstream service_b_backend {
        server service_b:80;
    }

    upstream service_c_backend {
        server service_c:80;
    }

    server {
        listen 80;

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }

        location /service_b {
            proxy_pass http://service_b:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        location /service_c {
            proxy_pass http://service_c:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

with the `upstream service_b_backend` and `upstream service_c_backend` defined, `Nginx` service is able to discover the `Servic-b` and `Service-c`. when you hit the url: 
```
http://<LoadBalancerA_DNS>/service-b
http://<LoadBalancerA_DNS>/service-c
```
You should receive: 
```
Service B Response
Service C Response
```
