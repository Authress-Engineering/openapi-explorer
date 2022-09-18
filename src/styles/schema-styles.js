import { css } from 'lit-element';

export default css`

*, *:before, *:after { box-sizing: border-box; }

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
  margin-bottom:1px; 
  display:inline-block;
}

.xxx-of-descr {
    font-family: var(--font-regular);
    font-size: calc(var(--font-size-small) - 1px);
    margin-left: 2px;
}

.stri, .string, .uri, .url, .byte, .bina, .binary, .date, .pass, .password, .ipv4, .ipv4, .uuid, .emai, .email, .host, .hostname {color:var(--green);}
.inte, .numb, .number, .int6, .int64, .int3, .int32, .floa, .float, .doub, .double, .deci, .decimal, .blue {color:var(--blue);}
.null {color:var(--red);}
.bool, .boolean {color:var(--orange)}
.enum, .cons, .const {color:var(--yellow)}

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
  /* TODO: add: The import highlight color variable */
  color: #38b3f9;
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
