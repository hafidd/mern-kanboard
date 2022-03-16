import React from "react";

export default function Log({
  logs,
  item = null,
  showUser = true,
  getLogText,
  formatDate,
}) {
  return (
    <>
      {item !== null ? (
        <>
          <h4>Item : {item.name}</h4>
          <br />
        </>
      ) : (
        ""
      )}
      {logs.map((dt, i) => {
        return (
          <div key={dt._id}>
            <small>{formatDate(new Date(dt.date))}</small> <br />
            <p>
              {showUser && (
                <>
                  <b>{dt.user.name}</b>{" "}
                </>
              )}
              {getLogText({ dt, item })}
            </p>
            {logs.length > i + 1 ? <hr /> : ""}
          </div>
        );
      })}
    </>
  );
}
