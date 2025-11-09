from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import mimetypes

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Si se pide un archivo estático existente, lo servimos
        filepath = self.path.lstrip('/')
        if os.path.isfile(filepath):
            self.send_response(200)
            mime_type, _ = mimetypes.guess_type(filepath)
            self.send_header('Content-type', mime_type or 'application/octet-stream')
            self.end_headers()
            with open(filepath, 'rb') as f:
                self.wfile.write(f.read())
            return

        # Si no, siempre devolvemos index.html
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        with open("index.html", "rb") as f:
            self.wfile.write(f.read())

if __name__ == '__main__':
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, Handler)
    print("Servidor corriendo en http://localhost:8080")
    httpd.serve_forever()
