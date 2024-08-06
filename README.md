# XML2Tree

**XML2Tree** is a JavaScript library that visualizes XML and XSD (XML Schema) data as an interactive tree structure using D3.js. The library provides a user-friendly way to parse and render hierarchical data, making it easy to understand and explore the structure of XML documents and schemas.

You can see XML2Tree in action on the [XMLFormatter.online](https://xmlformatter.online/), and blog on the [XML在线工具及代码开源](https://chenwenguan.com/xml-online-tool-and-opensource/).

## Features

- **XML and XSD Support**: Converts both XML and XSD formats into an interactive tree structure.
- **Attribute Handling**: Allows the option to display or hide XML attributes in the tree nodes.
- **Customizable Tree Layout**: Adjust the layout, spacing, and node representation to fit your needs.
- **Interactive Nodes**: Expand or collapse nodes by clicking, making it easy to explore large XML documents.
- **Export Options**: Save, print, or copy the tree as an image for easy sharing and documentation.
- **Responsive Design**: The tree is responsive and can be integrated into various screen sizes.

## Installation

You can install the library using npm:
```
npm install xml2tree
```
Or you can include it directly in your HTML file:
```
<script src="path/to/xml2tree.js"></script>
```

## Usage
Here's a basic example of how to use XML2Tree:
```
import XML2Tree from 'xml2tree';

const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema attributeFormDefault="unqualified" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="employees">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="employee" maxOccurs="unbounded" minOccurs="0">
          <xs:complexType>
            <xs:sequence>
              <xs:element type="xs:string" name="id"/>
              <xs:element type="xs:string" name="firstName"/>
              <xs:element type="xs:string" name="lastName"/>
              <xs:element type="xs:string" name="photo"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

const xml2TreeInstance = new XML2Tree({
  xmlText,
  saveTreeAsImage: saveButtonRef,   // Reference to save button
  printTreeAsImage: printButtonRef, // Reference to print button
  copyTreeAsImage: copyButtonRef,   // Reference to copy button
  onCopyComplete: () => alert('Tree copied to clipboard!')
});

// Append the tree to a specific DOM element
xml2TreeInstance.renderTo('#treeContainer');
```

## Example XML Data and Tree View
```
<library>
    <book>
        <title>XMLBasics</title>
        <author>JohnDoe</author>
        <year>2023</year>
    </book>
    <book>
        <title>AdvancedXML</title>
        <author>JaneSmith</author>
        <year>2024</year>
    </book>
</library>
```
![ic_xml_formatter_online_tree](https://github.com/user-attachments/assets/be7ffe43-072b-4652-8226-c889d28a2510)


## Options

- **xmlText**: The XML or XSD text to be converted and visualized.
- **saveTreeAsImage**: Reference to a button or element that triggers saving the tree as an image.
- **printTreeAsImage**: Reference to a button or element that triggers printing the tree.
- **copyTreeAsImage**: Reference to a button or element that triggers copying the tree as an image to the clipboard.
- **onCopyComplete**: Callback function executed when the tree is successfully copied.

## Development
To contribute to the project, clone the repository and install dependencies:
```
git clone https://github.com/yourusername/xml2tree.git
cd xml2tree
npm install
```

To start the development server:
```
npm start
```
## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to include tests for any new features or bug fixes.

## Acknowledgments
Special thanks to the contributors of D3.js and the open-source community for their invaluable resources and support.





