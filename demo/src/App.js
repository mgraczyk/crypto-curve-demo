import "./App.css";
import React from 'react';
import {
  loadStateFromUrl,
  withEagerLatestRace,
  createUrlStateWriteWithDebounce,
} from "./urlState.js";
import Sends from "./Sends.js";
import { Sequences, orderingToSequence } from "./Sequences.js";


const _defaultState = {
  reconciled: false,
  initialA: "500",
  initialB: "550",
  sendsFromAInput: "20,50",
  sendsFromBInput: "50,100",
  orderingsInput: "AABBaabb\nAABBbbaa\nAaAaBbBb\nAAaaBBbb",
  excessMode: "giveToNext",
  orderingsError: null,
  K: null,
  sendsFromA: [],
  sendsFromB: [],
  sequences: [],
};

const _keysToStoreInUrl = [
  "initialA",
  "initialB",
  "sendsFromAInput",
  "sendsFromBInput",
  "orderingsInput",
  "excessMode",
];

const tryParseOrdering = (orderingInput, sendsFromA, sendsFromB) => {
  const regExp = /[^ABab]/g;
  const letters = orderingInput.replace(regExp, '');
  if (letters.length === 0) {
    // Empty, so skip it.
    return [null, null];
  }

  let countA = 0;
  let countB = 0;

  const stackA = [];
  const stackB = [];
  const ordering = [];

  for (const letter of letters) {
    if (letter === "A") {
      if (countA >= sendsFromA.length) {
        return [null, 'Too many "A" characters'];
      }
      const send = sendsFromA[countA];
      stackA.push(send);
      countA += 1;
      ordering.push({ ...send, isStart: true });
    } else if (letter === "B") {
      if (countB >= sendsFromB.length) {
        return [null, 'Too many "B" characters'];
      }
      const send = sendsFromB[countB];
      stackB.push(send);
      countB += 1;
      ordering.push({ ...send, isStart: true });
    } else if (letter === "a") {
      if (stackA.length === 0) {
        return [null, 'Too many "a" characters'];
      }
      const send = stackA.pop();
      ordering.push({ ...send, isEnd: true });
    } else if (letter === "b") {
      if (stackB.length === 0) {
        return [null, 'Too many "b" characters'];
      }
      const send = stackB.pop();
      ordering.push({ ...send, isEnd: true });
    }
  }

  if (stackA.length) {
    return [null, 'Not enough "a" characters'];
  }
  if (stackB.length) {
    return [null, 'Not enough "b" characters'];
  }
  if (countA !== sendsFromA.length) {
    return [null, 'Not enough "A" characters'];
  }
  if (countB !== sendsFromB.length) {
    return [null, 'Not enough "B" characters'];
  }

  return [ordering, null];
};

const tryParseOrderings = (orderingsInput, sendsFromA, sendsFromB) => {
  const orderings = orderingsInput.split(/\r?\n/);
  const results = [];
  for (let i = 0; i < orderings.length; ++i) {
    const [result, error] = tryParseOrdering(orderings[i], sendsFromA, sendsFromB);
    if (error) {
      return [null, `Line ${i}: ${error}`];
    }
    if (result) {
      results.push(result);
    }
  }
  return [results, null];
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.putStateInUrl = createUrlStateWriteWithDebounce(1000);
    this.unbouncedReconcile = withEagerLatestRace(this.reconcile, null, 500);
  }

  state = _defaultState;

  componentDidMount() {
    const urlState = loadStateFromUrl();
    this.setState({
      ...this.state,
      ...urlState,
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state !== prevState) {
      this.putStateInUrl(Object.fromEntries(_keysToStoreInUrl.map(k => [k, this.state[k]])));
      this.unbouncedReconcile();
    }
  }

  handleChange = e => {
    this.setState({[e.target.name]: e.target.value, reconciled: false});
  }

  reconcile = () => {
    const {state} = this;
    if (state.reconciled) {
      return;
    }

    const getVals = (csv, label) => 
      csv
      .split(",")
      .filter(v => v.length)
      .map(v => Number(v));


    const sendsFromA = getVals(state.sendsFromAInput)
      .map((v, i) => ({
        id: `A.${i}`,
        fromA: true,
        valueIn: v,
      }));
    const sendsFromB = getVals(state.sendsFromBInput)
      .map((v, i) => ({
        id: `B.${i}`,
        fromB: true,
        valueIn: v,
      }));

    const A = Number(state.initialA);
    const B = Number(state.initialB);
    const K = A * B;
    const [orderings, orderingsError] = tryParseOrderings(state.orderingsInput, sendsFromA, sendsFromB);

    let sequences;
    if (!orderingsError) {
      sequences = orderings.map((o, i) => orderingToSequence(i, o, A, B, K), this.state.excessMode);
    }

    this.setState({
      reconciled: true,
      K, sendsFromA, sendsFromB,
      sequences, orderingsError,
    });
  }

  reset = () => {
    this.setState(_defaultState, this.reconcile);
  }

  render() {
    return (
      <div className="App">
      <h2>Computation</h2>
      <div className="curve-form">
        <span>&nbsp;</span>
        <button onClick={this.reset} style={{"width": "5em"}}>Reset</button>

        <label htmlFor="initialA">Initial A:</label>
        <input type="text" name="initialA" id="initialA"
               autoComplete="off"
               value={this.state.initialA} onChange={this.handleChange} />

        <label htmlFor="initialB">Initial B:</label>
        <input type="text" name="initialB" id="initialB"
               autoComplete="off"
               value={this.state.initialB} onChange={this.handleChange} />

        <label htmlFor="K">K:</label>
        <span id="K">{this.state.K}</span>

        <label htmlFor="sendsFromAInput">Send Amounts From A (comma separated):</label>
        <input type="text" name="sendsFromAInput" id="sendsFromAInput"
               autoComplete="off"
               placeholder="10,20,..."
               value={this.state.sendsFromAInput} onChange={this.handleChange} />

        <label htmlFor="sendsFromBInput">Send Amounts From B (comma separated):</label>
        <input type="text" name="sendsFromBInput" id="sendsFromBInput"
               autoComplete="off"
               placeholder="10,50,..."
               value={this.state.sendsFromBInput} onChange={this.handleChange} />

        <label htmlFor="orderingsInput">Orderings.&nbsp;
          <em>"AaBb" means start send from A, then end send from A, then start send from B, then end etc. 
           "ABba" means start send from A, then start send from B, then end send from b, then end from a.</em>
        </label>
        <textarea type="text" name="orderingsInput" id="orderingsInput"
               className={`${this.state.orderingsError ? "curve-error" : ""}`}
               title={this.state.orderingsError}
               autoComplete="off"
               placeholder="AAAaBbaa.."
               value={this.state.orderingsInput} onChange={this.handleChange} />

        <label htmlFor="excessMode">Mode to handle Excess Money:</label>
        <select id="excessMode" name="excessMode"
                value={this.state.excessMode} onChange={this.handleChange} >
          <option value="giveToNext">Give to next sender</option>
          <option value="giveEager">Give to first possible sender</option>
        </select>
      </div>

      <hr />

      {!this.state.reconciled ? <span>Computing...</span> :
        <>
        <Sends
          sendsFromA={this.state.sendsFromA}
          sendsFromB={this.state.sendsFromB} />
        <Sequences
          errorMessage={this.state.orderingsError}
          sequences={this.state.sequences} />
        </>
      }
      </div>
    );
  }
}

export default App;
