'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let emptyContainer = document.querySelector('.empty_container');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  name = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  name = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get user's position
    this._getPosition();

    //Get local storage
    this._getLocalStorage();

    //Attach event handlers
    //adding event listener to the form after the marker is clicked in the map
    form.addEventListener('submit', this._newWorkout.bind(this)); //when you have eventlistener inside the class you have to bind the this keyword
    inputType.addEventListener('change', this._toggleElevationFields);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    if (this.#workouts.length != 0) emptyContainer.classList.add('hidden');
  }
  _getPosition() {
    //using the Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }
  _loadMap(position) {
    const latt = position.coords.latitude;
    const lon = position.coords.longitude;
    console.log(`https://www.google.com/maps/@${latt},${lon}`);
    this.#map = L.map('map').setView([latt, lon], 16);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling click event on the map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(
        work.coords[0],
        work.coords[1],
        work.name,
        work
      );
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    emptyContainer.classList.add('hidden');
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    //empty Inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }
  _toggleElevationFields() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositives = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //data validation
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //data validation
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositives(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add new object to workout array
    this.#workouts.push(workout);

    //Render workout on map as a marker
    this._renderWorkoutMarker(lat, lng, type, workout);

    //Render workout on a list
    this._renderWorkout(workout);

    //hide the form + clear input fields
    this._hideForm();
    //display marker

    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkout(workout) {
    console.log(workout);
    let html = `
    <li class="workout workout--${workout.name}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
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
    if (workout.name === 'running')
      html += `  
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    if (workout.name === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _renderWorkoutMarker(lat, lng, type, workout) {
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _moveToPopup(e) {
    let workOutElement = e.target.closest('.workout'); //closest to select the list tile form the workout container, i.e event delegation
    if (!workOutElement) return;

    let workout = this.#workouts.find(
      work => work.id === workOutElement.dataset.id
    );

    this.#map.setView(workout.coords, 17, {
      animate: true,
      pan: { duration: 1 },
    });

    //using the public interface
    //workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    let data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

let app = new App();
