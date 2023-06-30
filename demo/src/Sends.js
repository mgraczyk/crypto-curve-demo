function SendsList({sends}) {
  return (
    <ul>
      {sends.length === 0 && <span>No Sends</span>}
      {sends.map(send => (
        <li key={send.id}>
          <span>id={send.id}, value={send.valueIn ?? "??"}</span>
        </li>
      ))}
    </ul>
  );
}

function Sends({sendsFromA, sendsFromB}) {
  return (
    <div>
      <h3>Transfers</h3>
      <div className="curve-horizontal">
        <div>
          <h4>From A to B</h4>
          <SendsList sends={sendsFromA} />
        </div>

        <div>
          <h4>From B to A</h4>
          <SendsList sends={sendsFromB} />
        </div>
      </div>
    </div>
  );
}


export default Sends;
