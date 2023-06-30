
function Sequences({sequences, errorMessage}) {
  const body = errorMessage ? 
    <span className="curve-error">{errorMessage}</span>
    :
    <div>
      {sequences.length === 0 && <span>No Sequences</span>}
      {sequences.slice(0,1000).map(sequence => (
        <div key={sequence.id}>
          <textarea readOnly style={{width: "100%", height: "450px"}}
                    value={JSON.stringify(sequence, "\n", "  ")} />
        </div>
      ))}
    </div>;

  return (
    <div>
      <h3>Sequences</h3>
      {body}
    </div>
  );
}

function listAllSequencesRecursive(sendsToStart, sendsToEnd, prefix, sequencesOut) {
  if (sendsToStart.length === 0 && sendsToEnd.length === 0) {
    if (prefix.length) {
      sequencesOut.push(prefix);
    }
    return;
  }
  
  for (let i = 0; i < sendsToStart.length; ++i) {
    const newSendsToStart = [
      ...sendsToStart.slice(0, i),
      ...sendsToStart.slice(i + 1)
    ];
    const send = sendsToStart[i];
    const newSendsToEnd = [...sendsToEnd, send];
    const newPrefix = [
      ...prefix,
      { ...send, isStart: true },
    ];
    listAllSequencesRecursive(newSendsToStart, newSendsToEnd, newPrefix, sequencesOut);
  }
  for (let i = 0; i < sendsToEnd.length; ++i) {
    const send = sendsToEnd[i];
    const newSendsToEnd = [
      ...sendsToEnd.slice(0, i),
      ...sendsToEnd.slice(i + 1)
    ];
    const newPrefix = [
      ...prefix,
      { ...send, isEnd: true },
    ];
    listAllSequencesRecursive(sendsToStart, newSendsToEnd, newPrefix, sequencesOut);
  }
}

function orderingToSequence(sequenceId, ordering, A, B, K, excessMode) {
  const stateA = {
    balance: A,
    remoteBalance: B,
    K,
  };
  const stateB = {
    balance: B,
    remoteBalance: A,
    K,
  };

  const bridgeTxns = {};
  const statePairs = [{stateA: {...stateA}, stateB: {...stateB}}];
  const transfers = [];

  for (const evt of ordering) {
    const {id, valueIn, fromA, isStart} = evt;
    const isOnA = (isStart && fromA) || (!isStart && !fromA);
    const localState = isOnA ? stateA : stateB;
    if (isStart) {
      transfers.push({id, currency: isOnA ? "A" : "B", amount: -valueIn});
      const amountReceived = valueIn;
      localState.balance += amountReceived;

      const amountSent = localState.remoteBalance - K / localState.balance;

      // TODO: Give extra when remote doesn't match??
      // But then maybe remote will think my balance is higher than it actually is?

      localState.remoteBalance -= amountSent;
      bridgeTxns[id] = { amountReceived, amountSent };
    } else {
      const { amountSent, amountReceived } = bridgeTxns[id];
      localState.remoteBalance += amountReceived;
      localState.balance -= amountSent;
      transfers.push({id, currency: isOnA ? "A" : "B", amount: amountSent});
    }
    statePairs.push({stateA: {...stateA}, stateB: {...stateB}});
  }

  const transfersById = {};
  for (const transfer of transfers) {
    const {id, currency, amount} = transfer;
    transfersById[id] = transfersById[id] ?? {};
    transfersById[id][currency] = (transfersById[id][currency] ?? 0) + amount;
  }

  const orderingToLetter = ({fromA, isStart}) => {
    if (fromA) {
      if (isStart) return "A";
      return "a";
    } else {
      if (isStart) return "B";
      return "b";
    }
  }

  return {
    ordering: ordering.map(orderingToLetter).join(""),
    stateA,
    stateB,
    transfersById,
    bridgeTxns,
    statePairs,
    id: sequenceId,
  };
}

function getAllSequences(sends, A, B, K) {
  const sequencesOut = [];
  listAllSequencesRecursive(sends, [], [], sequencesOut, 0, 5);
  return sequencesOut.map((ordering, i) => orderingToSequence(i, ordering, A, B, K));
}


export {Sequences, getAllSequences, orderingToSequence};
