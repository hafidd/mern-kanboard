import React, { useState } from "react";
import DatePicker from "react-datepicker";

import { compareDates, fontColor } from "../../helpers";

import "./Item.css";
import "react-datepicker/dist/react-datepicker.css";

import Modal from "../Modal";
import Log from "./Log";
import { useEffect } from "react";

export default function ({
  item,
  updateItem,
  formatDate,
  getLogText,
  deleteItem,
  team,
  labels,
  logs = [],
}) {
  const [modal, setModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  const openModal = (title = "title", content = null, data) => {
    setModalTitle(title);
    setModalContent(content);
    setModal(true);
  };

  const submitNewLabel = (data) => updateItem("new-label", data);
  const deleteLabel = (data) => updateItem("delete-label", data);
  const submitDesc = (data) => updateItem("update-desc", data);
  const submitNewMember = (data) => updateItem("new-member", data);
  const submitNewCheckList = (data) => updateItem("new-checklist", data);
  const deleteCheckList = (data) => updateItem("delete-checklist", data);
  const rename = (data) =>
    updateItem("rename-item", { old: item.name, new: data });

  return (
    <div className="item-detail">
      <Name itemName={item.name} rename={rename} />
      <div className="flex-wrap-1 mb1">
        <div className="mr2">
          <Labels labels={item.labels} openModal={openModal} />
        </div>
        <div className="mr2">
          <Members openModal={openModal} members={item.members} />
        </div>
        <div>
          <DueDate itemDd={item.dd} updateItem={updateItem} />
        </div>
      </div>
      <div className="mb1">
        <Desc submitDesc={submitDesc} itemDesc={item.desc} />
      </div>
      <div className="mb1">
        <CheckList
          checkList={item.checkList}
          openModal={openModal}
          updateItem={updateItem}
        />
      </div>
      <div className="mb1">
        <button
          className="btn1"
          onClick={() => openModal(item.name + " activity", "log")}
        >
          ☰ Activity Log
        </button>
        <button
          className="btn1 fr bg-red"
          onClick={() => {
            if (window.confirm(`delete card ${item.name}?`))
              deleteItem(item._id);
          }}
        >
          Delete
        </button>
      </div>

      <Modal title={modalTitle} visible={modal} setVisible={setModal} c="z999">
        {modalContent === "labels" ? (
          <UpdateLabels
            labels={item.labels}
            pLabels={labels}
            submitNewLabel={submitNewLabel}
            deleteLabel={deleteLabel}
            fontColor={fontColor}
          />
        ) : modalContent === "members" ? (
          <UpdateMembers
            members={item.members}
            submitNewMember={submitNewMember}
            team={team}
            updateItem={updateItem}
          />
        ) : modalContent === "checklist" ? (
          <UpdateChecklist
            checkList={item.checkList}
            submitNewCheckList={submitNewCheckList}
            deleteCheckList={deleteCheckList}
          />
        ) : modalContent === "log" ? (
          <Log
            item={item}
            logs={logs}
            formatDate={formatDate}
            getLogText={getLogText}
          />
        ) : (
          ""
        )}
      </Modal>
    </div>
  );
}

function Name({ itemName, rename }) {
  const [name, setName] = useState("");
  useEffect(() => setName(itemName), []);

  return (
    <div>
      <p className="bold">Name: </p>
      <input
        className="fw"
        type="text"
        defaultValue={itemName}
        onChange={(e) => setName(e.target.value)}
      ></input>
      {name !== itemName && (
        <button className="btn2" onClick={() => rename(name)}>
          Save
        </button>
      )}
    </div>
  );
}

function Desc({ itemDesc, submitDesc }) {
  const [desc, setDesc] = useState("");
  useEffect(() => setDesc(itemDesc), []);

  return (
    <>
      <p className="bold">Description</p>
      <textarea
        className="fw"
        rows="5"
        defaultValue={itemDesc}
        onChange={(e) => setDesc(e.target.value)}
      ></textarea>
      {desc !== itemDesc && (
        <button className="btn2" onClick={() => submitDesc(desc)}>
          Save
        </button>
      )}
    </>
  );
}

function Labels({ labels, openModal }) {
  return (
    <>
      <p className="bold">Labels</p>
      <ul>
        {labels.map((label, i) => (
          <li
            key={i}
            className="fl mr1 mb1 p1 font10 bold"
            style={{
              borderRadius: "2%",
              background: label.color || "white",
              color: fontColor(label.color || "#fff"),
            }}
          >
            {label.name}
          </li>
        ))}
        <li className="fl mr1 mb1">
          <button
            className="btn2"
            onClick={() => openModal("Labels", "labels", labels)}
          >
            <span> &#9998; </span>
          </button>
        </li>
      </ul>
    </>
  );
}

function Members({ members, openModal }) {
  return (
    <>
      <p className="bold">Members</p>
      <ul className="">
        {members &&
          members.map((member, i) => (
            <li key={i + member._id} className="fl mr1 mb1 p1 outline">
              {member.name}
            </li>
          ))}
        <li className="fl mr1 mb1 p1">
          <button
            className="btn2"
            onClick={() => openModal("Members", "members", members)}
          >
            <span> &#9998; </span>
          </button>
        </li>
      </ul>
    </>
  );
}

function CheckList({ checkList, updateItem, openModal }) {
  return (
    <>
      <p className="bold">
        Checklist
        {checkList.length ? (
          <span>
            {" ("}
            {checkList.reduce((ac, c) => (c.completed ? ac + 1 : ac), 0)}/
            {checkList.length}
            {")"}
          </span>
        ) : (
          ""
        )}
      </p>
      <ul>
        {checkList.map((check, i) => (
          <li key={i}>
            <input
              type="checkbox"
              checked={check.completed}
              value={check._id}
              onChange={(e) => {
                e.preventDefault();
                updateItem("update-checklist", {
                  _id: check._id,
                  name: check.name,
                  completed: !check.completed,
                });
              }}
            />{" "}
            {check.name}
          </li>
        ))}
        <li>
          <button
            className="btn2"
            onClick={() => openModal("Checklist", "checklist", checkList)}
          >
            <span> &#9998; </span>
          </button>
        </li>
      </ul>
    </>
  );
}

function DueDate({ itemDd, updateItem }) {
  const [dd, setDd] = useState(null);
  useEffect(() => setDd(itemDd ? new Date(itemDd) : null), []);

  return (
    <>
      <p className="bold">Due date</p>
      <DatePicker
        placeholderText="&#9998;"
        selected={dd ? dd : itemDd ? new Date(itemDd) : null}
        onChange={(date) => setDd(date)}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="time"
        dateFormat="d MMMM yyyy H:mm"
      />
      {!compareDates(dd, itemDd ? new Date(itemDd) : null) && (
        <button className="btn2" onClick={() => updateItem("update-dd", dd)}>
          Save
        </button>
      )}
    </>
  );
}

function UpdateLabels(props) {
  const { labels, submitNewLabel, deleteLabel, pLabels, fontColor } = props;
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFFFFF");

  const ColorBtn = ({ color }) => (
    <button
      type="button"
      style={{
        padding: 0,
        width: 22,
        height: 22,
        marginLeft: 5,
        border: "none",
        background: color,
        cursor: "pointer",
      }}
      onClick={() => setColor(color)}
    ></button>
  );

  return (
    <ul>
      {labels.map((label, i) => (
        <li
          key={i}
          style={{
            background: label.color || "white",
            color: fontColor(label.color || "#fff"),
            border: "1px solid black",
            padding: 2,
            marginBottom: 1,
          }}
        >
          {label.name}{" "}
          <button
            className="btn2"
            type="button"
            style={{ float: "right" }}
            onClick={() => deleteLabel({ _id: label._id, name: label.name })}
          >
            x
          </button>
        </li>
      ))}
      <li style={{ marginTop: 4 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) submitNewLabel({ name, color });
            setName("");
          }}
        >
          <div style={{ background: "#f3f2f0", padding: 4 }}>
            <div className="fw">
              <input
                className="fw"
                type="text"
                placeholder="New label"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="color"
                style={{ padding: 0 }}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              {["#ff0000", "#00ff00", "#0000ff", "#ffff00"].map((color) => (
                <ColorBtn key={color} color={color} />
              ))}
            </div>
            <div
              style={{
                maxWidth: "300px",
                padding: "5px 0",

                textAlign: "center",
              }}
            >
              {pLabels.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  style={{
                    background: l.color,
                    color: fontColor(l.color || "#fff"),
                    border: "none",
                    boxShadow: "0 1px 0 #091e4240",
                    margin: "1px",
                    padding: 1,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setName(l.name);
                    setColor(l.color);
                  }}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <button className="fw btn1">Add</button>
          </div>
        </form>
      </li>
    </ul>
  );
}

function UpdateMembers(props) {
  const { members, team, updateItem } = props;
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
              });
              updateItem("update-members", {
                _id: e.target.value,
                name: member.name,
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

function UpdateChecklist(props) {
  const { checkList, submitNewCheckList, deleteCheckList } = props;
  const [name, setName] = useState("");

  return (
    <ul>
      {checkList.length ? (
        checkList.map((check, i) => (
          <li key={i + check._id} style={{ marginBottom: 1 }}>
            <button
              className="btn1"
              onClick={() =>
                deleteCheckList({ _id: check._id, name: check.name })
              }
            >
              x
            </button>{" "}
            {check.name}
          </li>
        ))
      ) : (
        <li>Belum ada checklist</li>
      )}
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
          <button className="fw btn1">Add</button>
        </form>
      </li>
    </ul>
  );
}
