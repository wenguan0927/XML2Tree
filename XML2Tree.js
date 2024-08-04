import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { saveAs } from 'file-saver';
import { Canvg } from 'canvg';
import styles from './styles/XML2Tree.module.css';

/**
 * Main function. Specifies transformations that are needed for creating a JSON out of XML.
 * @constructor
 * @param {string} divClass - id of element that will contain a tree.
 * @param {string} file - Path to XML/JSON file.
 * @param {array} impNodes - Important nodes that should be shown on the second level of the tree.
 * @param {boolean} isAttributes - Whether to show or not all additional attributes.
 * @param {boolean} isJSON - Specifies type of the input (JSON/XML).
 */
const xml2tree = (divId, XMLText, impNodes = [], isAttributes = false) => {
	const tagArray = XMLToArray(XMLText);
	const mapArray = arrayMapping(tagArray, impNodes, isAttributes);
	const JSONText = arrayToJSON(mapArray);
	let maxDepth = 0;
	let maxWidth = 0;
	const depthArray = new Array(tagArray.length).fill(0);

	tagArray.forEach(tag => {
		if (tag.depth > maxWidth) {
			maxWidth = tag.depth;
		}
		depthArray[tag.depth] += 1;
	});

	maxWidth += 1;
	maxDepth = Math.max(...depthArray);
	drawTree(divId, JSONText, maxDepth, maxWidth, true);
};

/**
 * Creates an array out of XML.
 * @constructor
 * @param {string} text - XML text with input contents.
 */
function XMLToArray(text) {
	var head = '';
	var currentString = '';
	var documentType = '';
	var ifCurrentStringIsHead = false;
	var ifCurrentStringIsComment = false;
	var ifCurrentStringIsTag = false;
	var ifCurrentStringIsDocumentType = false;
	var newTag = new Object();
	var tagArray = [];
	var tagStack = [];
	var id = 0;
	for (var i = 0; i < text.length; i++) {  // for all symbols in the text
		if (text[i] == '<' && !ifCurrentStringIsComment) {  // if we found an open tag and we are not writing a comment at the moment
			if (text[i + 1] == '?') {  // if that's a headline
				ifCurrentStringIsHead = true;
			} else if (text[i + 1] == '!' && text[i + 2] == '-' && text[i + 3] == '-') {  // if that's an end of a comment
				ifCurrentStringIsComment = true;
			} else if (text[i + 1] == '!') {
				ifCurrentStringIsDocumentType = true;
			} else {
				if (tagStack.length) { // if tagStack is not empty
					while (currentString[currentString.length - 1] == ' ') {
						currentString = currentString.substring(0, currentString.length - 1);
					}
					tagArray[tagStack[tagStack.length - 1].id - 1].value = currentString;  // add the information that's outside tags
					currentString = '';
				}
				ifCurrentStringIsTag = true;  // start the next tag
			}
		} else if (text[i] == '>') {  // if we found a close tag
			if (ifCurrentStringIsHead) {  // if we are writing a headline
				if (text[i - 1] == '?') {
					ifCurrentStringIsHead = false;
				} else {
					//
				}
			} else if (ifCurrentStringIsComment) {  // if we are writing a comment
				if (text[i - 1] == '-' && text[i - 2] == '-') {  // and that's the end of the comment
					ifCurrentStringIsComment = false;
				}
			} else if (ifCurrentStringIsDocumentType) {  // if we are writing the document type
				ifCurrentStringIsDocumentType = false;
			} else if (ifCurrentStringIsTag) {  // if we are writing the information that's inside tags
				if (text[i - 1] == '/') {  // if the tag is closed inside itself
					newTag.tag = currentString.substring(0, currentString.length - 1);  // isolating the information inside the tag
					currentString = '';
					id += 1;
					newTag.id = id;
					newTag.children = [];
					newTag.depth = tagStack.length;  // adding the depth level of the tag
					if (tagStack.length) {  // if there is smth in the stack
						newTag.parent = tagStack[tagStack.length - 1].id;  // we save the last element of stack as current tag's parent
						tagArray[tagStack[tagStack.length - 1].id - 1].children.push(newTag.id);  // we add a current tag as a child to the last element
					} else {
						newTag.parent = 0;
					}
					tagArray.push(newTag);
				} else {
					if (currentString[0] == '/') {  // if it is a closing tag
						currentString = '';
						tagStack.pop();  // delete this tag from the stack
					} else {
						newTag.tag = currentString;
						currentString = '';
						id += 1;
						newTag.id = id;
						newTag.children = [];
						newTag.depth = tagStack.length;  // adding the depth level of the tag
						if (tagStack.length) {  // if there is smth in the stack
							newTag.parent = tagStack[tagStack.length - 1].id;  // we save the last element of stack as current tag's parent
							tagArray[tagStack[tagStack.length - 1].id - 1].children.push(newTag.id);  // we add a current tag as a child to the last element
						} else {
							newTag.parent = 0;
						}
						tagArray.push(newTag);
						tagStack.push(newTag);
					}
				}
				ifCurrentStringIsTag = false;
				newTag={};
			}
		} else if (ifCurrentStringIsHead) {
			if (text[i] !== '?' && !(text[i] == '?' && text[i+1] == '>') && !(text[i] == '?' && text[i-1] == '<')) {
				head += text[i];
			} else {
				//
			}
		} else if (ifCurrentStringIsComment) {
			//
		} else if (ifCurrentStringIsTag) {
			currentString += text[i];
		} else if (ifCurrentStringIsDocumentType) {
			documentType += text[i];
		} else {  // avoid all the irrelevant symbols inside and outside the tags
			if (text[i] !== '\n' && text[i] != '\r' && text[i] != '\t' && !(text[i] == ' ' && !currentString.length)) {
				currentString += text[i];
			} else {
				//
			}
		}
	}
	if (tagStack.length) {  // if after the end of the process, the stack is not empty - means number of opening tags is bigger than closing
		console.error('XML file is not correct!');
	}
	return tagArray;
}

/**
 * Parses and processes all the information inside the array with input contents.
 * @constructor
 * @param {array} tagArray - Array of nodes' tags.
 * @param {array} impNodes - List of nodes that should be shown on the second level.
 * @param {boolean} isAttributes - Whether to show or not all additional attributes.
 */
function arrayMapping(tagArray, impNodes, isAttributes) {
	var mapArray = attrTrans(tagArray, isAttributes);
	if (impNodes.length) {
		var extra = new Object();
		extra.children = [];
		extra.depth = 1;
		extra.id = tagArray.length+1;
		extra.parent = 1;
		extra.type = 'Extra';
		tagArray.push(extra);
		var noMoreChildren = [];
		var ifChild = false;
		for (var i = 0; i < tagArray.length - 1; i++) {  // length - 1 because we want to exclude newly added tag 'Extra'
			if (tagArray[i].depth == 1) {
				ifChild = false;
				for (var j = 0; j < impNodes.length; j++) {
					if (tagArray[i].type == impNodes[j]) {
						ifChild = true;
						break;
					}
				}
				if (!ifChild) {
					tagArray[i].parent = extra.id;
					tagArray[tagArray.length - 1].children.push(tagArray[i].id);
					noMoreChildren.push(tagArray[i].id);
				}
			}
		}
		var newRootChildren = [];
		for (var i = 0; i < tagArray[0].children.length; i++) {
			var ifEqual = false;
			for (var j = 0; j < noMoreChildren.length; j++) {
				if (tagArray[0].children[i] == noMoreChildren[j]) {
					ifEqual = true;
					break;
				}
			}
			if (!ifEqual) {
				newRootChildren.push(tagArray[0].children[i]);
			}
		}
		tagArray[0].children = newRootChildren;
		tagArray[0].children.push(extra.id);
	}
	return mapArray;
}

/**
 * Creates a final structure of an object to draw.
 * @constructor
 * @param {array} tagArray - Array of nodes' tags.
 * @param {boolean} isAttributes - Whether to show or not all additional attributes.
 */
function attrTrans(tagArray, isAttributes) {  // dealing with attributes of the objects
	for (var i = 0; i < tagArray.length; i++) {
		var tagString = tagArray[i].tag;
		var nodeAttributes = tagString.split(" ");
		tagArray[i].type = '';
		tagArray[i].attr = [];
		let nameAttr = '';  // 初始化 name 属性
		let typeAttr = '';  // 初始化 type 属性

		for (var j = 0; j < nodeAttributes.length; j++) {
			if (j === 0) {
				tagArray[i].type = nodeAttributes[j];
			} else if (isAttributes) {
				tagArray[i].attr.push(nodeAttributes[j]);
			}

			// 提取 name 属性值
			if (nodeAttributes[j].startsWith('name="')) {
				nameAttr = nodeAttributes[j].replace('name="', '').replace('"', '');
			}

			// 提取 type 属性值
			if (nodeAttributes[j].startsWith('type="')) {
				typeAttr = nodeAttributes[j].replace('type="xs:', '').replace('"', '');
			}
		}

		// 如果节点类型是 xs:element
		if (tagArray[i].type === 'xs:element') {
			if (nameAttr && typeAttr) {
				// 如果同时存在 name 和 type 属性
				tagArray[i].type = `element: name="${nameAttr}" type="${typeAttr}"`;
			} else if (nameAttr) {
				// 如果只存在 name 属性
				tagArray[i].type = `element: name="${nameAttr}"`;
			}
		} else if (tagArray[i].type.startsWith('xs:')) {
			// 去掉以 xs: 开头的前缀
			tagArray[i].type = tagArray[i].type.replace('xs:', '');
		}
	}
	return tagArray;
}

/**
 * Converts an array to JSON.
 * @constructor
 * @param {array} tagArray - Array of nodes' tags.
 */
function arrayToJSON(tagArray) {  // converting array to json type
	var JSONText = [];
	var root = new Object();
	root = objToJSON(tagArray, 0, false);
	JSONText.push(root);
	return JSONText
}

/**
 * Converts an object to JSON.
 * @constructor
 * @param {array} tagArray - Array of nodes' tags.
 * @param {array} id - id of the node.
 * @param {array} parent - id of node's parent.
 */
function objToJSON(tagArray, id, parent) {
	var node = new Object();  // we create an empty object and save there all the relevant information about the node
	node.value = tagArray[id].value;
	node.name = tagArray[id].name;
	node.extra = tagArray[id].extra;
	node.type = tagArray[id].type;
	node.attr = tagArray[id].attr;
	if (parent == false) {
		node.parent = 'null'
	} else {
		node.parent = parent.name;
	}
	node.children = [];
	for (var i = 0; i < tagArray[id].children.length; i++) {  // for all children of the node we do the same
		node.children.push(objToJSON(tagArray, tagArray[id].children[i] - 1, node));
	}
	return node
}

/**
 * Draws a tree out of input using d3 library.
 * @constructor
 * @param {array} selectString - id of element that will contain a tree.
 * @param {array} treeData - Final JSON object.
 * @param {array} maxDepth - Maximum depth of the tree (for controling of drawn tree height).
 * @param {array} maxWidth - Maximum width of the tree (for controling of drawn tree width).
 */
const drawTree = (selectString, treeData, maxDepth, maxWidth, expandAll = false) => {
	const margin = { top: 150, right: 50, bottom: 50, left: 50 },
		nodeWidth = 250,
		nodeHeight = 80,
		nodeSpacingX = 150,
		maxNodeWidth = 150, // Maximum width for displaying key and value
		width = (maxWidth) * (nodeWidth + nodeSpacingX),
		height = (maxDepth + 1) * (nodeHeight) + margin.bottom + margin.top;

	let i = 0,
		duration = 750,
		root;

	const treeLayout = d3.tree().nodeSize([nodeHeight, nodeWidth]);

	const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

	const svg = d3.select(`#${selectString}`).append("svg")
		.attr("width", width) // Add right margin for extra dragging space
		.attr("height", height) // Add bottom margin for extra dragging space
		.append("g")
		.style("background-color", "transparent")
		.attr("transform", "translate(" + margin.left + "," + (height / 2)  + ")");

	// Center the root node vertically in the scrollContainer
	root = d3.hierarchy(treeData[0], d => d.children);
	root.x0 = height / 2;; // Center the root node vertically
	root.y0 = 0;

	const collapse = (d) => {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	};

	const expand = (d) => {
		if (d._children) {
			d.children = d._children;
			d.children.forEach(expand);
			d._children = null;
		}
	};

	if (expandAll) {
		root.children.forEach(expand);
	} else {
		root.children.forEach(collapse);
	}
	update(root);

	function update(source) {
		const treeData = treeLayout(root);
		const nodes = treeData.descendants();
		const links = treeData.links();

		nodes.forEach(d => { d.y = d.depth * (nodeWidth + nodeSpacingX); });

		const node = svg.selectAll('g.node')
			.data(nodes, d => d.id || (d.id = ++i));

		const nodeEnter = node.enter().append('g')
			.attr('class', 'node')
			.attr('transform', d => `translate(${source.y0},${source.x0})`)
			.on('click', click);

		nodeEnter.append('circle')
			.attr('class', 'node')
			.attr('r', 1e-6)
			.style('fill', d => d._children ? '#a2d5f2' : '#FFFFFF')
			.attr('stroke', '#a2d5f2')
			.attr('stroke-width', '3px');

		nodeEnter.append('text')
			.attr('dy', d => d.children || d._children ? '1.8em' : '.35em')
			.attr('x', 0)
			.attr('text-anchor', 'middle')
			.text(d => d.children || d._children ? d.data.type : '')
			.style('fill', '#2d4059')
			.style('font-size', d => d.children || d._children ? '14px' : '12px') // Adjust font size
			.style('fill-opacity', 1e-6);

		nodeEnter.append('text')
			.attr('dy', '.35em')
			.attr('x', 20)
			.attr('text-anchor', 'start')
			.text(d => {
				if (!d.children && !d._children) {
					if (d.data.type && d.data.value) {
						return `${d.data.type}: ${d.data.value}`;
					}
					if (d.data.type) {
						return `${d.data.type}`;
					}
				}
				return '';
			})
			.style('fill', '#2d4059')
			.style('font-size', '12px');

		const nodeUpdate = node.merge(nodeEnter).transition()
			.duration(duration)
			.attr('transform', d => `translate(${d.y},${d.x})`);

		nodeUpdate.select('circle')
			.attr('r', 10)
			.style('fill', d => d._children ? '#a2d5f2' : '#FFFFFF');

		nodeUpdate.select('text')
			.style('fill-opacity', 1);

		nodeUpdate.select('.key-value')
			.style('fill-opacity', 1);

		const nodeExit = node.exit().transition()
			.duration(duration)
			.attr('transform', d => `translate(${source.y},${source.x})`)
			.remove();

		nodeExit.select('circle')
			.attr('r', 1e-6);

		nodeExit.select('text')
			.style('fill-opacity', 1e-6);

		nodeExit.select('.key-value')
			.style('fill-opacity', 1e-6);

		const link = svg.selectAll('path.link')
			.data(links, d => d.target.id);

		const linkEnter = link.enter().insert('path', 'g')
			.attr('class', 'link')
			.attr('d', d => {
				const o = { x: source.x0, y: source.y0 };
				return diagonal({ source: o, target: o });
			});

		link.merge(linkEnter).transition()
			.duration(duration)
			.attr('d', diagonal)
			.attr('fill', 'none')
			.attr('stroke', '#a2d5f2')
			.attr('stroke-width', '2px');

		link.exit().transition()
			.duration(duration)
			.attr('d', d => {
				const o = { x: source.x, y: source.y };
				return diagonal({ source: o, target: o });
			})
			.remove();

		nodes.forEach(d => {
			d.x0 = d.x;
			d.y0 = d.y;
		});

		centerRootNode();
	}

	function click(event, d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update(d);
	}

	function centerRootNode() {
		const container = document.getElementById(selectString).parentElement.parentElement; // Get the outer parent element
		const svgElement = document.querySelector(`#${selectString} svg`);
		const containerHeight = container.getBoundingClientRect().height;
		const svgHeight = svgElement.getBoundingClientRect().height;
		container.scrollTop = (svgHeight - containerHeight) / 2;
	}
};

const XML2Tree = ({ xmlText, saveTreeAsImage, printTreeAsImage, copyTreeAsImage, onCopyComplete}) => {
	const treeRef = useRef(null);
	const scrollRef = useRef(null);

	useEffect(() => {
		if (xmlText && treeRef.current) {
			d3.select(treeRef.current).selectAll("*").remove(); // Clear previous tree
			xml2tree(treeRef.current.id, xmlText);

			const svgContainer = d3.select(scrollRef.current);
			let isDragging = false;
			let startX, startY;

			svgContainer.on('mousedown', (event) => {
				isDragging = true;
				startX = event.pageX;
				startY = event.pageY;
			});

			svgContainer.on('mousemove', (event) => {
				if (isDragging) {
					const dx = event.pageX - startX;
					const dy = event.pageY - startY;
					svgContainer.node().scrollLeft -= dx;
					svgContainer.node().scrollTop -= dy;
					startX = event.pageX;
					startY = event.pageY;
				}
			});

			svgContainer.on('mouseup', () => {
				isDragging = false;
			});

			svgContainer.on('mouseleave', () => {
				isDragging = false;
			});
		} else if(xmlText === null) {
			d3.select(treeRef.current).selectAll("*").remove(); // Clear previous tree
		}
	}, [xmlText]);

	useEffect(() => {
		const addWatermark = (ctx, canvas, isPrint) => {
			const text = 'Generate by: https://xmlformatter.online';
			const fontSize = 16;
			ctx.font = `${fontSize}px Arial`;
			ctx.fillStyle = 'rgba(45, 64, 89, 0.5)';

			const textMetrics = ctx.measureText(text);
			const textWidth = textMetrics.width;
			const textHeight = fontSize; // Approximation for text height

			const x = (canvas.width - textWidth) / 2;
			const y = canvas.height - textHeight - 5; // 5 pixels padding from bottom

			if(isPrint) {
				ctx.fillText(text, 10, 20);
			} else {
				ctx.fillText(text, x, y);
			}
		};

		const processCanvas = async (svgElement, isPrint) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const v = Canvg.fromString(ctx, new XMLSerializer().serializeToString(svgElement), { ignoreDimensions: true });

			canvas.width = svgElement.clientWidth;
			canvas.height = svgElement.clientHeight;

			await v.render();
			addWatermark(ctx, canvas, isPrint);

			return canvas;
		};

		if (saveTreeAsImage && treeRef.current) {
			saveTreeAsImage.current = async () => {
				try {
					const svgElement = treeRef.current.querySelector('svg');
					const canvas = await processCanvas(svgElement, false);

					const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
					const fileName = `XML_Formatter_Online_Tree_${timestamp}.png`;

					canvas.toBlob(blob => {
						saveAs(blob, fileName);
					}, 'image/png');
				} catch (error) {
					console.error('Error saving tree as image:', error);
				}
			};
		}

		if (printTreeAsImage && treeRef.current) {
			printTreeAsImage.current = async () => {
				try {
					const svgElement = treeRef.current.querySelector('svg');
					const canvas = await processCanvas(svgElement, true);

					const dataUrl = canvas.toDataURL('image/png');
					const printWindow = window.open('', '_blank');
					printWindow.document.write(`<img src="${dataUrl}" onload="window.print();window.close();" />`);
				} catch (error) {
					console.error('Error printing tree as image:', error);
				}
			};
		}

		if (copyTreeAsImage && treeRef.current) {
			copyTreeAsImage.current = async () => {
				try {
					const svgElement = treeRef.current.querySelector('svg');
					const canvas = await processCanvas(svgElement, false);

					canvas.toBlob(async blob => {
						const item = new ClipboardItem({ 'image/png': blob });
						await navigator.clipboard.write([item]);
						onCopyComplete(); // 调用外部传入的回调函数
					}, 'image/png');
				} catch (error) {
					console.error('Error copying tree as image:', error);
				}
			};
		}
	}, [saveTreeAsImage, printTreeAsImage, copyTreeAsImage, onCopyComplete]);

	return (
		<div ref={scrollRef} className={styles.scrollContainer}>
			<div id="treeContainer" ref={treeRef} className={styles.treeContainer}></div>
		</div>
	);
};

export default XML2Tree;