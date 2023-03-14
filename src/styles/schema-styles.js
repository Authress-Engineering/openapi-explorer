import { css } from 'lit';

export default css`

*, *:before, *:after { box-sizing: border-box; }

.no-select {
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.tr {
  display: flex;
  flex: none;
  width: 100%;
  box-sizing: content-box;
  border-bottom: 1px dotted transparent;
}
.td {
  display: block;
  flex: 0 0 auto;
}
.key {
  font-family: var(--font-mono);
  white-space: normal;
  word-break: break-all;
}

.key-descr {
  line-height: 1.7;
  font-family:var(--font-regular);
  flex-shrink: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  display: none;
  max-height: auto;
}
.toolbar {
  display: none;
}

.xxx-of-key {
  font-size: calc(var(--font-size-small) - 2px); 
  font-weight:bold; 
  background-color:var(--primary-color); 
  color: var(--primary-btn-text-color);
  border-radius:2px;
  line-height:calc(var(--font-size-small) + 6px);
  padding:0px 5px;
  display:inline-block;
}

.xxx-of-descr {
    font-family: var(--font-regular);
    font-size: calc(var(--font-size-small) - 1px);
    margin-left: 2px;
}

.stri, .string, .uri, .url, .byte, .bina, .binary, .date, .datetime, .date-time, .pass, .password, .ipv4, .ipv4, .uuid, .emai, .email, .host, .hostname { color:var(--green); }
.inte, .integer, .numb, .number, .int6, .int64, .int3, .int32, .floa, .float, .doub, .double, .deci, .decimal, .blue { color:var(--blue); }
.null { color:var(--red); }
.bool, .boolean { color:var(--orange); }
.enum, .cons, .const { color:var(--purple); }

.tree .toolbar {
  display: flex;
  justify-content: space-between;
}

.toolbar {
  width:100%;
}
.toolbar-item {
  cursor: pointer;
  padding: 5px 0 5px 1rem;
  margin: 0 1rem !important;
  color: var(--secondary-color);
  flex-shrink: 0;
}
.tree .toolbar .toolbar-item {
  display: none;
}
.schema-root-type {
  cursor:auto;
  color:var(--fg2);
  font-weight: bold;
  text-transform: uppercase;
}
.schema-root-type.xxx-of {
  display:none;
}
.toolbar-item:first-of-type { margin:0 2px 0 0;}

/* Expand a block from 0 to something visible, then to probably full screen, then beyond most screens.
   Unlike with a transition, the final CSS can have an unbounded height, which will take effect after the animation. */
@keyframes expand-height {
  0% { max-height: 0; }
  50% { max-height: 100px; }
  95% { max-height: 1000px; }
  100% { max-height: 5000px; }
}
/* Inverse of the above, collapsing quickly at first (to avoid a delay if the element is already quite short)
   then slowing towards 0. */
@keyframes collapse-height {
  0% { max-height: 5000px; }
  5% { max-height: 500px; }
  50% { max-height: 100px; }
  100% { max-height: 0; }
}

@media only screen and (min-width: 576px) {
  .key-descr {
    display: block;
  }
  .tree .toolbar .toolbar-item {
    display: block;
  }
  .toolbar {
    display: flex;
  }
}
`;
