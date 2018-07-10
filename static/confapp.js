(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-121965714-1', 'auto');
ga('send', 'pageview');

const ONE_HOUR_MS = 60 * 3600 * 1000;

const [when, start] = parseDate("20180719T170000Z");
const [_, end] = parseDate("20180719T193000Z");

function applyFilters() {
  showMessage("Filtering events...")
  var total = 0;
  var showing = 0;
  var after;
  var afterIndex = 3 + Math.floor(Math.random() * 7);
  $.each($(".event"), function () {
    function display(event) {
      total++;
      if (localStorage.starred == "true" && !starred(event.attr("uid"))) return "none";
      const filter = new RegExp((localStorage.filter || "").toLowerCase());
      if (filter && !event.text().toLowerCase().match(filter)) return "none";
      showing++;
      if (showing === afterIndex) after = event;
      return "block";
    }
    $(this).css("display", display($(this)));
  })
  if (after) {
    $(".announcement")
      .insertAfter(after)
      .css("display", "block");
  }
  const count = showing == total ? total : (showing + " of " + total);
  showMessage("Showing " + count + " events.");
  scrollToCurrentEvent();
}

function addUberMessage() {
    $("#events").append(
      $("<div class=event>")
        .attr("when", 0)
        .addClass("announcement")
        .append(
          $("<div class=when>")
            .css("width", $(window).width() - 60)
            .html("Uber proudly sponsors ECOOP, ISSTA, and CurryOn"),
          $("<div class=summary>")
            .html("We are <a target=_blank href='http://chrislaffra.com'>hiring</a> in Amsterdam"),
          $("<div class=speakers>")
            .css("width", $(window).width() - 60)
            .html("See you at the <a target=_blank href='https://ecoopisstauberkeynotenetworkin.splashthat.com/'>Uber Reception</a> on Thursday"),
        )
      );
}

function render() {
  if (refresh(!localStorage.events)) return;
  showMessage("Loading events...")
  addUberMessage();
  const events = JSON.parse(localStorage.events);
  for (event of events) {
    $("#events").append(
      $("<div class=event>")
        .attr("when", event.when)
        .attr("uid", event.uid)
        .append(
          $("<div class=when>")
            .css("width", $(window).width() - 60)
            .text(event.start + "–" + event.end.slice(13) + "  @  " + event.location),
          $("<img class=star>")
            .attr("src", starred(event.uid) ? "static/star-yellow.png" : "static/star-white.png")
            .attr("uid", event.uid)
            .click(function () {
              const uid = $(this).attr("uid");
              starred(uid, !starred(uid));
              $(this).attr("src", starred(uid) ? "static/star-yellow.png" : "static/star-white.png");
              if (localStorage.starred == "true" && !starred(uid)) $(this).parent().remove();
            }),
          $("<div class=summary>")
            .text(event.summary),
          $("<div class=speakers>")
            .css("width", $(window).width() - 60)
            .text(event.speakers),
          $("<div class=details>")
            .text(event.details ? "–" : "+")
            .css("display", event.description ? "block" : "none")
            .click(function () {
              event.details = !event.details;
              $(this)
                .text(event.details ? "–" : "+")
                .parent().find(".description").css("display", event.details ? "block" : "none")
            }),
          $("<div class=description>")
            .append(event.description.split("\n").map(function (paragraph) {
              return $("<div>")
                .html(paragraph)
            }))
            .css("display", event.details ? "block" : "none"),
        )
      );
  }
  setTimeout(applyFilters);
  setupToolbar();
}

function showMessage(message) {
  $(".message")
    .text(message)
  if ($(".banner").attr("state") !== "hidden") {
    $(".message")
      .css("top", "25px");
  }
  setTimeout(function () { hideMessage(message); }, 1500);
  ga('send', 'event', 'user event', message);
  console.log(message);
}

function hideMessage(message) {
  if ($(".message").text() === message) {
    $(".message")
      .css("top", "-60px");
  }
}

function starred(uid, value) {
  if (value != undefined) localStorage[uid] = value;
  else return localStorage[uid] == "true";
}

function setupToolbar() {
  $(".filter")
    .val(localStorage.filter || "")
    .change(function () {
      showMessage("Searching for " + localStorage.filter + "...")
      localStorage.filter = $(this).val();
      applyFilters();
    });
  $(".x")
    .click(function () {
      showMessage("Cleared search filter");
      $(".filter").val("").change();
    });
  $(".starred")
    .attr("src", localStorage.starred == "true" ? "static/star-yellow.png" : "static/star-white.png")
    .click(function () {
      localStorage.starred = !(localStorage.starred == "true");
      showMessage("Toggled starred to " + localStorage.starred);
      $(this).attr("src", localStorage.starred == "true" ? "static/star-yellow.png" : "static/star-white.png")
      applyFilters();
    });
  $(".refresh")
    .click(function () {
      showMessage("Clicked ");
      $("#events").empty();
      refresh(true);
      localStorage.timestamp = 0;
    });
  $(".main")
    .css("padding-top", $(".banner").height());
  $(".now")
    .click(function () {
      showMessage("Clicked Now");
      applyFilters();
    });
  $(".uber")
    .click(function () {
      showMessage("Clicked Uber");
      $(".filter").val(localStorage.filter = "Uber|Laffra");
      applyFilters();
    });
  localStorage.top = 0;
}

function scrollToCurrentEvent() {
  $(window).scrollTop(findCurrentEvent().offset().top - 50);
}

function findCurrentEvent() {
  const now = new Date().getTime();
  const events = $(".event");
  for (var index in events) {
    var event = events.eq(index);
    if (event.css("display") === "none") continue;
    if (event.attr("when") > now) return event;
  }
  return null;
}

function refresh(force) {
  const now = new Date().getTime();
  showMessage("Refreshing...");
  if (force || now - (localStorage.refresh_timestamp || 0) > ONE_HOUR_MS) {
    localStorage.refresh_timestamp = ""+now;
    $.get("/ical?url=" + ICAL_URL, function (data) {
      localStorage.events = JSON.stringify(convert(data));
      document.location.reload();
    })
    return true;
  }
  return false;
}

function convert(data) {
  const events = [];
  let event = {};
  data.split("\r\n").map(function (line) {
    let tag = "";
    let value = "";
    let _ = "";
    try {
      [_, tag, value] = line.match(/([^:]*)\:(.*)/);
      value = value.replace(/\\n/g, "\n").replace(/\\/g, "");
    } catch (e) {
      showMessage("Could not convert meetings details: " + e);
    }
    if (tag == "UID") {
      event.uid = value;
    }
    else if (tag == "DTSTART") {
      [event.when, event.start] = parseDate(value);
    }
    else if (tag == "DTEND") {
      [event.when, event.end] = parseDate(value);
    }
    else if (tag == "SUMMARY") {
      event.summary = value;
      event.track = "";
      if (value[0] == "[" && value.indexOf("]") != -1) {
        event.track = value.slice(1, value.indexOf("]"));
        event.summary = value.slice(event.track.length + 3);
        event.speakers = "";
        if (event.summary.indexOf(" - ") != -1) {
          event.speakers = event.summary.slice(event.summary.indexOf(" - ") + 3);
          event.summary = event.summary.slice(0, event.summary.indexOf(" - "));
        }
      }
    }
    else if (tag == "DESCRIPTION") {
      event.description = value;
    }
    else if (tag == "LOCATION") {
      event.location = value.replace(" - Piet Heinkade 11, Amsterdam, Netherlands", "").replace(" Room", "");
    }
    else if (tag == "END") {
      events.push(event);
      event = {};
    }
  });
  return events.sort(function (a, b) {
    return a.when - b.when;
  });
}

function parseDate(dateString) {
  // convert a date string such as 20180718T130000Z to a Date
  const year = parseFloat(dateString.slice(0, 4));
  const month = parseFloat(dateString.slice(4, 6)) - 1;
  const day = parseFloat(dateString.slice(6, 8));
  const hours = parseFloat(dateString.slice(9, 11)) + 2;
  const minutes = parseFloat(dateString.slice(11, 13));
  const seconds = parseFloat(dateString.slice(13, 15));
  const dt = new Date(year, month, day, hours, minutes, seconds)
  const s = dt.toString()
    .replace("2018", "–")
    .replace(/:00 .*/, "")
    .replace(" GMT+0200 (Central European Summer Time)", "");
  return [dt.getTime(), s];
}

function hideBanner() {
  if ($(".banner").attr("state") === "hidden") return;
  $(".banner")
    .css("top", -$(".banner").height() - 20)
    .attr("state", "hidden");
}

function showBanner() {
  if ($(".banner").attr("state") === "shown") return;
  $(".banner")
    .css("top", 0)
    .attr("state", "shown");
}

$(window).scroll(function () {
  const top = $(window).scrollTop();
  if (top < 200) {
    showBanner();
    return
  }
  const diff = top - localStorage.top;
  if (Math.abs(diff) < 10) return;
  if (diff > 0) {
    hideBanner();
  } else {
    showBanner();
  }
  localStorage.top = top;
});
