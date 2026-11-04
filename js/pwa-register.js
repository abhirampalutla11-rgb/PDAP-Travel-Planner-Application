if ("serviceWorker" in navigator && location.protocol === "https:") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
          .catch(error => console.warn("WanderWise offline support could not start:", error));
      });
    }
