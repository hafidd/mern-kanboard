import React, { useState } from "react";
import DatePicker from "react-datepicker";

import "./Item.css";
import "react-datepicker/dist/react-datepicker.css";

import Modal from "../Modal";
import { useEffect } from "react";

export default function ({ item, updateItem }) {
  const [dd, setDd] = useState(null);
  const [desc, setDesc] = useState("");

  const [modal, setModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    setDd(item.dd ? new Date(item.dd) : null);
    setDesc(item.desc || "");
  }, [item]);

  const openModal = (title = "title", content = null, data) => {
    setModalTitle(title);
    setModalContent(content);
    setModal(true);
  };

  const submitNewLabel = (data) => updateItem("new-label", data);
  const submitDesc = (data) => updateItem("update-desc", desc);
  const submitNewMember = (data) => updateItem("new-member", data);
  const submitNewCheckList = (data) => updateItem("new-checklist", data);

  var compareDates = function (date1, date2) {
    if (date1 === date2) return true;
    if (date1 > date2 || date1 < date2) return false;
    return true;
  };

  return (
    <div className="item-detail">
      <Modal title={modalTitle} visible={modal} setVisible={setModal}>
        {modalContent === "labels" ? (
          <Labels labels={item.labels} submitNewLabel={submitNewLabel} />
        ) : modalContent === "members" ? (
          <Members members={item.members} submitNewMember={submitNewMember} />
        ) : modalContent === "checklist" ? (
          <Checklist
            checkList={item.checkList}
            submitNewCheckList={submitNewCheckList}
          />
        ) : (
          ""
        )}
      </Modal>
      <div className="flex-wrap-1 mb1">
        {/* labels  */}
        <div className="mr2">
          <p>Labels</p>
          <ul>
            {item.labels.map((label, i) => (
              <li key={i} className="fl mr1 mb1 p1">
                <span
                  className=""
                  style={{ background: label.color || "white" }}
                >
                  {label.name}
                </span>
              </li>
            ))}
            <li className="fl mr1 mb1">
              <button
                className=""
                onClick={() => openModal("Labels", "labels", item.labels)}
              >
                <span> &#9998; </span>
              </button>
            </li>
          </ul>
        </div>
        {/* members */}
        <div className="mr2">
          <p>Members</p>
          <ul className="">
            {item.members &&
              item.members.map((member, i) => (
                <li key={i + member._id} className="fl mr1 mb1 p1 outline">
                  {member.name}
                </li>
              ))}
            <li className="fl mr1 mb1 p1">
              <button
                className=""
                onClick={() => openModal("Members", "members", item.members)}
              >
                <span> &#9998; </span>
              </button>
            </li>
          </ul>
        </div>
        {/* due date */}
        <div>
          <p>Due date</p>
          <DatePicker
            selected={dd}
            onChange={(date) => setDd(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="time"
            dateFormat="d MMMM yyyy H:mm"
          />
          {!compareDates(dd, item.dd ? new Date(item.dd) : null) && (
            <button onClick={() => updateItem("update-dd", dd)}>Save</button>
          )}
        </div>
      </div>
      {/* desc */}
      <div className="mb1">
        <p>Description</p>
        <textarea
          className="fw"
          rows="4"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        ></textarea>
        {desc !== item.desc && (
          <button onClick={() => submitDesc()}>Save</button>
        )}
      </div>
      {/* checklist */}
      <div className="mb1">
        <p>Checklist</p>
        <ul>
          {item.checkList.map((check, i) => (
            <li key={i}>
              <input
                type="checkbox"
                checked={check.completed}
                value={check._id}
                onChange={(e) => {
                  e.preventDefault();
                  updateItem("update-checklist", {
                    _id: check._id,
                    completed: !check.completed,
                  });
                }}
              />{" "}
              {check.name}
            </li>
          ))}
          <li>
            <button
              className=""
              onClick={() =>
                openModal("Checklist", "checklist", item.checkList)
              }
            >
              <span> &#9998; </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Labels(props) {
  const { labels, submitNewLabel } = props;
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFFFFF");

  return (
    <ul>
      {labels.map((label, i) => (
        <li
          key={i}
          style={{
            background: label.color || "white",
            border: "1px solid black",
            padding: "2px",
          }}
        >
          {label.name}
        </li>
      ))}
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) submitNewLabel({ name, color });
            setName("");
          }}
        >
          <div className="fw">
            <input
              type="text"
              placeholder="New label"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <button className="fw">Add</button>
        </form>
      </li>
    </ul>
  );
}

function Members(props) {
  const { members, submitNewMember } = props;
  const [email, setEmail] = useState("");

  return (
    <ul>
      {members.map((member, i) => (
        <li key={i}>{member.name}</li>
      ))}
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) submitNewMember(email);
            setEmail("");
          }}
        >
          <div className="fw">
            <input
              className="fw"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="fw">Add</button>
        </form>
      </li>
    </ul>
  );
}

function Checklist(props) {
  const { checkList, submitNewCheckList } = props;
  const [name, setName] = useState("");

  return (
    <ul>
      {checkList.length
        ? checkList.map((check, i) => <li key={i + check._id}>{check.name}</li>)
        : "No data"}
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) submitNewCheckList({ name });
            setName("");
          }}
        >
          <div className="fw">
            <input
              className="fw"
              type="text"
              placeholder="New list"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button className="fw">Add</button>
        </form>
      </li>
    </ul>
  );
}
