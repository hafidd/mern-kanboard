import React from "react";

function x() {
  console.log("test rendered");
  return "nothing";
}

export default React.memo(x);
//export default x;
