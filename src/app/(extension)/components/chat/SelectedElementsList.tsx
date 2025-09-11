/**
 * SelectedElementsList Component
 * Displays and manages selected elements
 */

import React from 'react';

export interface SelectedElement {
  id: string;
  displayName: string;
  element: HTMLElement;
}

export interface SelectedElementsListProps {
  elements: SelectedElement[];
  onElementRemove: (index: number) => void;
}

export const SelectedElementsList: React.FC<SelectedElementsListProps> = ({
  elements,
  onElementRemove
}) => {
  return (
    <div className="peekberry-selected-elements-horizontal">
      {elements.length === 0 ? (
        <div className="peekberry-elements-help">
          <div className="peekberry-help-text">
            🎯 Select elements on the page to get started
          </div>
        </div>
      ) : (
        <div className="peekberry-elements-scroll">
          {elements.map((element, index) => (
            <div key={element.id} className="peekberry-element-tag-horizontal">
              <span>{element.displayName}</span>
              <button 
                className="peekberry-remove-element" 
                onClick={() => onElementRemove(index)}
                title="Remove element"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectedElementsList;
