'use strict';

////////////////////////////////////////
// WORKOUT - Parent class
////////////////////////////////////////

class Workout {
  ////////////////////////////////////////
  // Public field
  id = String(Date.now()).slice(-10);

  ////////////////////////////////////////
  // Private field
  #date = new Date();

  ////////////////////////////////////////
  // Construnctor
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  setDescriction() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.#date.getMonth()]
    } ${this.#date.getDate()}`;
  }
}

////////////////////////////////////////
// RUNNING - Child class
////////////////////////////////////////

class Running extends Workout {
  ////////////////////////////////////////
  // Public field
  type = 'running';

  ////////////////////////////////////////
  // Constructor
  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;
    this._pace();
    this.setDescriction();
  }

  ////////////////////////////////////////
  // Pace [Minute / KM]
  _pace() {
    this.pace = this.duration / this.distance;
  }
}

////////////////////////////////////////
// CYCLING - Child class
////////////////////////////////////////

class Cycling extends Workout {
  ////////////////////////////////////////
  // Public field
  type = 'cycling';

  ////////////////////////////////////////
  // Constructor
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._speed();
    this.setDescriction();
  }

  ////////////////////////////////////////
  // Speed [KM / Hour]
  _speed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

////////////////////////////////////////
// APP
////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  ////////////////////////////////////////
  // Private field
  #map;
  #mapE;
  #mapZoomLevel = 13;
  #workouts = [];

  ////////////////////////////////////////
  // Constructure
  constructor() {
    this._getPosition();
    this._loadLocalStorage();
    this._toggleElevationField();
    this._newWorkout();
    this._moveToMarker();
  }

  ////////////////////////////////////////
  // Load data from local storage
  _loadLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(w => {
      this._renderList(w);
    });
  }

  ////////////////////////////////////////
  // Get Position
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }

  ////////////////////////////////////////
  // Load map
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this._showForm();

    this.#workouts.forEach(w => this._renderMarkerToMap(w));
  }

  ////////////////////////////////////////
  // Show form
  _showForm() {
    this.#map.on(
      'click',
      function (mapEvent) {
        form.classList.remove('hidden');
        this.#mapE = mapEvent;
        inputDistance.focus();
      }.bind(this)
    );
  }

  ////////////////////////////////////////
  // Hide form
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  ////////////////////////////////////////
  // Toggle input
  _toggleElevationField() {
    inputType.addEventListener('change', function () {
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }

  ////////////////////////////////////////
  // New workout
  _newWorkout() {
    // prettier-ignore
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        //Helper function
        const validNum = (...inputs) =>
          inputs.every(par => Number.isFinite(par));
        const positifNum = (...inputs) => inputs.every(par => par > 0);

        // Get data from user
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapE.latlng;
        let workout;

        // Create Workout Running if type running
        if (type === 'running') {
          const cadance = +inputCadence.value;

          // Check valid inputs
          if (
            !(
              validNum(distance, duration, cadance) &&
              positifNum(distance, duration, cadance)
            )
          )
            return alert('Input positif valid number');

          // Add running object
          workout = new Running(distance, duration, [lat, lng], cadance);
        }

        // Create Workout Cycling if type cycling
        if (type === 'cycling') {
          const elevation = +inputElevation.value;

          // Check valid inputs
          if (
            !(
              validNum(distance, duration, elevation) &&
              positifNum(distance, duration)
            )
          )
            return alert('Input positif valid number');

          // Add cycling object
          workout = new Cycling(distance, duration, [lat, lng], elevation);
        }

        // Add workout object to #workouts array
        this.#workouts.push(workout);

        // Render list
        this._renderList(workout);

        // Rendeer marker to map
        this._renderMarkerToMap(workout);

        // Hide form and value
         inputCadence.value =
           inputDistance.value =
           inputDuration.value =
           inputElevation.value =
             '';
        this._hideForm();

        // Store workout to local storage
        this._storeLocalStorage()

      }.bind(this));
  }

  _renderList(workout) {
    let HTML = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      HTML += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadance}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
      `;
    }

    if (workout.type === 'cycling') {
      HTML += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </iv>
    </li>
      `;
    }

    form.insertAdjacentHTML('afterend', HTML);
  }

  _renderMarkerToMap(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `<p>${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workout.description
        }</p>`
      )
      .openPopup();
  }

  _moveToMarker() {
    // prettier-ignore
    containerWorkouts.addEventListener('click', function(e) {
      const workoutList = e.target.closest('.workout');

      if (!workoutList) return
      const workoutClicked = this.#workouts.find(w => w.id === workoutList.dataset.id);

      this.#map.setView(workoutClicked.coords, this.#mapZoomLevel, {
        animate: true,
        duration: 1
      })
      
    }.bind(this))
  }

  _storeLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
