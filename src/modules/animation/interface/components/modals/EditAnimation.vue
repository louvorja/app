<template>
  <div>
    <div class="main_container">
      <!-- svg making up the clock -->
      <svg viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <!-- filters describing the shadows, applied on the larger and smaller shapes -->
          <filter id="shadow-large">
            <feDropShadow dx="0" dy="0" stdDeviation="4" />
          </filter>
          <filter id="shadow-small">
            <feDropShadow dx="0" dy="0" stdDeviation="0.2" />
          </filter>

          <!-- mask used to cut out a sliver of the overlaid circle -->
          <mask id="mask">
            <g transform="translate(50 50)">
              <!-- starting at -15, incrementing by 30 for each hour -->
              <g class="hours" transform="rotate(-15)">
                <circle cx="0" cy="0" r="50" fill="#fff"></circle>
                <path d="M 0 -50 v 50 l 28.86 -50" fill="#000"></path>
              </g>
            </g>
          </mask>
        </defs>

        <!-- circle making up the bottom of the clock -->
        <circle cx="50" cy="50" r="46" fill="#303335"></circle>

        <!-- circle with the accent color, overlaid before the text elements -->
        <circle cx="50" cy="50" r="42" fill="#EA3F3F" filter="url(#shadow-large)"></circle>

        <!-- text elements, positioned from the center around the clock -->
        <g
          class="clock--face"
          font-size="8px"
          transform="translate(50 50)"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          <!-- the elements are included through the script, at intervals of 30 degrees -->
          <!--
        <text
            transform="rotate(-90) translate(35 0) rotate(90)" >
            12
        </text>

        <text
            transform="rotate(-0) translate(35 0) rotate(0)" >
            03
        </text>
        --></g>

        <!-- circle overlaid on the accent circle and text elements -->
        <circle mask="url(#mask)" cx="50" cy="50" r="50" fill="#303335"></circle>

        <!-- smaller circle on which the hands sit -->
        <circle cx="50" cy="50" r="4" filter="url(#shadow-small)" fill="#303335"></circle>

        <!-- clock's hands -->
        <!-- centered in the clock and rotated according to the passage of time in the 0-360 range -->
        <g class="hands" transform="translate(50 50)">
          <g class="minutes" transform="rotate(240)">
            <!-- change rotation of this group to affect both clock's hand -->
            <path fill="#fff" d="M -0.4 8 h 0.8 v -33 h -0.8 z"></path>
            <circle fill="#303335" cx="0" cy="0" r="0.6"></circle>
          </g>

          <g class="seconds" transform="rotate(80)">
            <!-- change rotation of this group to affect both clock's hand -->
            <path fill="#EA3F3F" d="M -0.4 10 h 0.8 v -45 h -0.8 z"></path>
            <circle
              stroke-width="0.4"
              stroke="#EA3F3F"
              fill="#303335"
              cx="0"
              cy="0"
              r="0.8"
            ></circle>
          </g>
        </g>
      </svg>

      <!-- div wrapping the controls to change the number of hours/minutes/seconds -->
      <div class="controls">
        <div class="controls_control" data-control="hours">
          <button>+</button>
          <span class="control--hours">h</span>
          <button>-</button>
        </div>

        <div class="controls_control" data-control="minutes">
          <button>+</button>
          <span class="control--minutes">m</span>
          <button>-</button>
        </div>

        <div class="controls_control" data-control="seconds">
          <button>+</button>
          <span class="control--seconds">s</span>
          <button>-</button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- ONLINE - Load Dependencie by CDN -->
<script setup>
import { onMounted } from "vue";
import log from "../../../scripts/log.js";

log("CreateAnimation.vue");

onMounted(() => {
  log("CreateAnimation.vue mounted");
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js";
  script.async = true;

  script.onload = () => {
    const zeroPadded = (number) => (number >= 10 ? number.toString() : `0${number}`);

    // function taking as input an hour value in the [0-23] range and returning the 12 hours format
    const twelveClock = (twentyFourClock) => {
      if (twentyFourClock === 0) {
        return 12;
      }
      if (twentyFourClock > 12) {
        return twentyFourClock - 12;
      }
      return twentyFourClock;
    };

    // 1. SVG clock face
    const clockFace = document.querySelector("svg g.clock--face");
    // add the twelve numbers by rotating, translating and then rotating back text elements
    // ! add a zero to the numbers smaller than 10 through the utility function
    for (let i = 0; i < 12; i += 1) {
      clockFace.innerHTML += `
    <text
        transform="rotate(${-90 + 30 * (i + 1)}) translate(34 0) rotate(${90 - 30 * (i + 1)})" >
        ${zeroPadded(i + 1)}
    </text>
  `;
    }

    // SVG & BUTTONS current time
    // retrieve the current number of hours, minutes and seconds
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // as hours in the 0-23 range, normalize the values in the 1-12 range
    const time = {
      hours: twelveClock(hours), // 1-12
      minutes, // 0-59
      seconds, // 0-59
    };

    // create another object describing the time's value, for the rotation of the hands
    // this to avoid the glitch occurring when the time goes back to 0 (or back to 1 for the hours)
    const rotation = {
      hours: twelveClock(hours),
      minutes,
      seconds,
    };

    // use the values to update the svg and the text of the span elements
    const entries = Object.entries(time);
    entries.forEach(([key, value]) => {
      anime({
        targets: `g.${key}`,
        transform: key === "hours" ? `rotate(${-15 + value * 30})` : `rotate(${value * 6})`,
        duration: 2000,
      });

      const span = document.querySelector(`span.control--${key}`);
      span.textContent = zeroPadded(value);
    });

    // BUTTONS click event
    const buttons = document.querySelectorAll("button");

    // function returning new values for the time and rotation object, according to the input instructions
    function updateValues(instructions) {
      /* destructure the necessary information
  key: hours, minutes or seconds
  operation: + or -
  timeValue: number in the [1-12] or [0-59] range
  rotationValue: number
  */
      const { key, operation } = instructions;
      const { timeValue, rotationValue } = instructions;

      // create a number of degrees based on the previous value and the current operation
      const degrees = operation === "+" ? rotationValue + 1 : rotationValue - 1;
      // create a number of hours/minutes/seconds on the basis of the operation
      let value = operation === "+" ? timeValue + 1 : timeValue - 1;

      // format the value to fall in the prescribed range
      if (key === "hours") {
        value = value > 12 ? 1 : value === 0 ? 12 : value;
      } else {
        value = value > 59 ? 0 : value < 0 ? 59 : value;
      }

      // return the updated time and rotation value
      return { value, degrees };
    }

    // function called when a click is registered on the button elements
    function handleClick() {
      // retrieve the necessary information from the wrapping container and the current element
      const key = this.parentElement.getAttribute("data-control");
      const operation = this.textContent;
      // retrieve the previous values
      const timeValue = time[key];
      const rotationValue = rotation[key];

      // based on the set instruction call the function updating the time and rotation values
      const instructions = {
        key,
        operation,
        timeValue,
        rotationValue,
      };
      const { value, degrees } = updateValues(instructions);

      // update the objects
      time[key] = value;
      rotation[key] = degrees;

      // update the position of the matching hand
      anime({
        targets: `g.${key}`,
        transform: key === "hours" ? `rotate(${-15 + degrees * 30})` : `rotate(${degrees * 6})`,
        duration: 400,
        // remove the event listeners from the input buttons until the animation is complete
        begin: () => buttons.forEach((button) => button.removeEventListener("click", handleClick)),
        complete: () => buttons.forEach((button) => button.addEventListener("click", handleClick)),
      });

      // update the text of the matching span
      if (key !== null) {
        const span = document.querySelector(`span.control--${key}`);
        span.textContent = zeroPadded(value);
      }
    }

    buttons.forEach((button) => button.addEventListener("click", handleClick));
  };
  document.body.appendChild(script);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Barlow|Barlow+Condensed&display=swap");

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
/* position the svg and div wrapping the controls one atop the other */
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #262728;
  font-family: "Barlow", sans-serif;
}
/* have the clock describing the svg expand to cover a sizeable portion of the viewport */
svg {
  margin-top: 1rem;
  width: 60vmin;
  height: auto;
  filter: url(#shadow-large);
}
svg text {
  font-family: "Barlow Condensed", sans-serif;
}

/* display the controls side by side */
.controls {
  display: flex;
  flex-wrap: wrap;
  margin-top: 2rem;
}
/* display the button+span elements in columns */
.controls div {
  text-align: center;
  display: flex;
  flex-direction: column;
  margin: 1rem;
}
/* style the buttons with the same colors used for the clock */
.controls div button {
  border: none;
  border-radius: 50%;
  background: #ea3f3f;
  padding: 0.25rem;
  color: #fff;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  filter: url(#shadow-large);
  margin: 0.5rem 0;
}
.controls div span {
  color: #fff;
}

.main_container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
</style>
