import React, { useState } from "react";
import DatePicker from "react-datepicker";

import { compareDates, fontColor } from "../../helpers";

import "./Item.css";
import "react-datepicker/dist/react-datepicker.css";

import Modal from "../Modal";
import { useEffect } from "react";

export default function ({ item, updateItem, team }) {
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

  return (
    <div className="item-detail">
      <Modal title={modalTitle} visible={modal} setVisible={setModal} c="z999">
        {modalContent === "labels" ? (
          <Labels labels={item.labels} submitNewLabel={submitNewLabel} />
        ) : modalContent === "members" ? (
          <Members
            members={item.members}
            submitNewMember={submitNewMember}
            team={team}
            updateItem={updateItem}
          />
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
              <li
                key={i}
                className="fl mr1 mb1 p1 font10 bold"
                style={{
                  borderRadius: "5%",
                  background: label.color || "white",
                  color: fontColor(label.color || "#fff"),
                }}
              >
                {label.name}
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
            placeholderText="&#9998;"
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
        <p>
          Checklist
          {item.checkList.length ? (
            <span>
              {" ("}
              {item.checkList.reduce((ac, c) => (c.completed ? ac + 1 : ac), 0)}
              /{item.checkList.length}
              {")"}
            </span>
          ) : (
            ""
          )}
        </p>
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
  const { members, submitNewMember, team, updateItem } = props;
  const [email, setEmail] = useState("");
  const memberIds = members.map((m) => m._id);

  return (
    <ul>
      {team.map((member, i) => (
        <li key={i} className="p1">
          <input
            type="checkbox"
            name={member._id}
            value={member._id}
            checked={memberIds.indexOf(member._id) !== -1}
            onChange={(e) => {
              console.log({
                _id: e.target.value,
                checked: e.target.checked,
              })
              updateItem("update-members", {
                _id: e.target.value,
                checked: e.target.checked,
              });
            }}
          />{" "}
          {member.name}
        </li>
      ))}
      <li></li>
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
