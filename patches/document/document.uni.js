/*
  document 扩展包
  github：https://github.com/jin-yufeng/Parser
  docs：https://jin-yufeng.github.io/Parser
  author：JinYufeng
*/
const MpHtmlParser = require('./MpHtmlParser.js');
class element {
	constructor(node, context) {
		node.attrs = node.attrs || {};
		node.children = node.children || [];
		this.nodeName = node.name;
		this.id = node.attrs.id;
		this._node = node;
		this.childNodes = [];
		for (let i = 0; i < node.children.length; i++)
			if (node.children[i].name)
				this.childNodes.push(new element(node.children[i], this._context));
		this.attributes = this._node.attrs;
		this.style = {};
		var styleArr = (node.attrs.style || '').split(';');
		for (let i = 0; i < styleArr.length; i++)
			if (styleArr[i].includes(':')) {
				var info = styleArr[i].split(':');
				this.style[info[0]] = info[1];
			}
		this._context = context;
	}
	// 获取 / 设置 文本
	get innerText() {
		return this._context.getText([this._node]);
	}
	set innerText(text) {
		this._node.children = [{
			type: 'text',
			text
		}];
		this.childNodes = [];
	}
	// 获取 / 设置 html
	get outerHTML() {
		return (function f(node) {
			var html = '';
			if (node.type == 'text')
				html += node.text;
			else {
				html += '<' + node.name;
				for (var attr in node.attrs)
					if (node.attrs[attr])
						html += ` ${attr}="${node.attrs[attr]}"`;
				if (!node.children || !node.children.length) html += '/>';
				else {
					html += '>';
					for (var i = 0; i < node.children.length; i++)
						html += f(node.children[i]);
					html += '</' + node.name + '>';
				}
			}
			return html;
		})(this._node);
	}
	get innerHTML() {
		var outerHTML = this.outerHTML;
		return outerHTML.substring(outerHTML.indexOf('>') + 1, outerHTML.lastIndexOf('<'));
	}
	set innerHTML(value) {
		this._node.children = new MpHtmlParser(value, this._context).parse();
		for (var i = 0; i < this._node.children.length; i++)
			if (this._node.children[i].name)
				this.childNodes.push(new element(this._node.children[i], this._context));
	}
	// 添加 / 删除 / 替换 节点
	appendChild(child) {
		if (child.constructor != element) return false;
		this.childNodes.push(child);
		this._node.children.push(child._node);
		return true;
	}
	removeChild(child) {
		if (child.constructor != element) return false;
		var i = this.childNodes.indexOf(child);
		if (i == -1) return false;
		this.childNodes.splice(i, 1);
		this._node.children.splice(i, 1);
		return true;
	}
	replaceChild(oldVal, newVal) {
		if (oldVal.constructor != element) return false;
		if (newVal.constructor != element) return false;
		var i = this.childNodes.indexOf(oldVal);
		if (i == -1) return false;
		this.childNodes[i] = newVal;
		this._node.children[i] = newVal._node;
		return true;
	}
	// 获取 / 设置 某个属性
	getAttribute(key) {
		if (Object.hasOwnProperty.call(this._node.attrs, key))
			return this._node.attrs[key];
		else return null;
	}
	setAttribute(key, value) {
		this._node.attrs[key] = value;
		return true;
	}
	// 获取某个样式
	getStyle(key) {
		key = key.replace(/(A-Z)/g, '-$1').toLowerCase();
		if (Object.hasOwnProperty.call(this.style, key)) return this.style[key];
		else return null;
	}
	// 设置某个样式
	setStyle(key, value) {
		key = key.replace(/(A-Z)/g, '-$1').toLowerCase();
		if (Object.hasOwnProperty.call(this.style, key)) {
			this.style[key] = value;
			var style = '';
			for (var item in this.style)
				style += item + ':' + this.style[item] + ';';
			this._node.attrs.style = style;
		} else this._node.attrs.style = `${this._node.attrs.style || ''};${key}:${value}`;
		return true;
	}
	// 查找节点
	_search(node, search, type) {
		if (node.type == 'text') return;
		if (type == 'id' && node.attrs && node.attrs.id == search)
			return this._nodeList.push(new element(node, this._context));
		if ((type == 'name' && node.name == search) || (type == 'class' && node.attrs && node.attrs.class == search))
			this._nodeList.push(new element(node, this._context));
		if (node.children && node.children.length)
			for (var i = node.children.length; i--;)
				this._search(node.children[i], search, type);
	}
	getElementById(id) {
		this._nodeList = [];
		this._search(this._node, id, 'id');
		return this._nodeList[0];
	}
	getElementsByClassName(className) {
		this._nodeList = [];
		this._search(this._node, className, 'class');
		return this._nodeList;
	}
	getElementsByTagName(name) {
		this._nodeList = [];
		this._search(this._node, name, 'name');
		return this._nodeList;
	}
}
class dom {
	constructor(context) {
		this._context = context;
	}
	_search(nodes, search, type) {
		for (var i = 0, node; node = (nodes || [])[i]; i++) {
			if (node.type == 'text') continue;
			if (type == 'id' && node.attrs && node.attrs.id == search)
				return this._nodeList.push(new element(node, this._context));
			if ((type == 'name' && node.name == search) || (type == 'class' && node.attrs && node.attrs.class == search))
				this._nodeList.push(new element(node, this._context));
			this._search(node.children, search, type);
		}
	}
	get body() {
		return new element({
			name: 'body',
			children: this._context.nodes
		}, this._context)
	}
	getElementById(id) {
		this._nodeList = [];
		this._search(this._context.nodes, id, 'id');
		return this._nodeList[0];
	}
	getElementsByClassName(className) {
		this._nodeList = [];
		this._search(this._context.nodes, className, 'class');
		return this._nodeList;
	}
	getElementsByTagName(name) {
		this._nodeList = [];
		this._search(this._context.nodes, name, 'name');
		return this._nodeList;
	}
	createElement(name) {
		return new element({
			name
		}, this._context);
	}
	write(value) {
		this._context.nodes = value.constructor == Array ? value : new MpHtmlParser(value, this._context).parse();
		return true;
	}
}
module.exports = dom;
