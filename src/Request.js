class Request {
  static load(url, callback, options) {
    const req = new XMLHttpRequest();

    const timer = setTimeout((t) => {
      if (req.readyState !== 4) {
        req.abort();
        callback("status");
      }
    }, 10000);

    req.onreadystatechange = () => {
      if (req.readyState !== 4) {
        return;
      }

      clearTimeout(timer);

      if (!req.status || req.status < 200 || req.status > 299) {
        callback("status");
        return;
      }

      callback(null, req);
    };

    req.open("GET", url);
    if (options && options.headers) {
      for (let key in options.headers) {
        req.setRequestHeader(key, options.headers[key]);
      }
    }
    req.send(null);

    return {
      abort: () => {
        req.abort();
      },
    };
  }

  static getText(url, callback, options) {
    return this.load(
      url,
      (err, res) => {
        if (err) {
          callback(err);
          return;
        }
        if (res.responseText !== undefined) {
          callback(null, res.responseText);
        } else {
          callback("content");
        }
      },
      options
    );
  }

  static getXML(url, callback, options) {
    return this.load(
      url,
      (err, res) => {
        if (err) {
          callback(err);
          return;
        }
        if (res.responseXML !== undefined) {
          callback(null, res.responseXML);
        } else {
          callback("content");
        }
      },
      options
    );
  }

  static getJSON(url, callback, options) {
    return this.load(
      url,
      (err, res) => {
        if (err) {
          callback(err);
          return;
        }
        if (!res.responseText) {
          callback("content");
          return;
        }

        let json;
        try {
          json = JSON.parse(res.responseText);
          callback(null, json);
        } catch (ex) {
          console.warn(`Could not parse JSON from ${url}\n${ex.message}`);
          callback("content");
        }
      },
      options
    );
  }
}
