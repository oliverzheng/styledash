/** @flow */

import React from 'react';
import classnames from 'classnames';
import chunk from 'chunk';
import invariant from 'invariant';

import './LayoutGrid.css';

type PropType = {
  columnCount: number,
  sizing:
    // Either gutter is fixed and items are flexible, or gutter is flexible and
    // items are fixed.
    { gutterSize: number } |
    { itemSize: number },

  className?: ?string,
  children: any,
};

export default class LayoutGrid extends React.Component<PropType> {
  render(): React$Element<*> {
    const {columnCount, sizing, children} = this.props;
    const chunks = chunk(React.Children.toArray(children), columnCount);
    const lastChunk = chunks[chunks.length - 1];

    // Fill the last row so it's complete
    const lastChunkCount = lastChunk.length;
    for (let i = 0; i < (columnCount - lastChunkCount); i++) {
      lastChunk.push(null);
    }

    let gutterFixed: boolean;
    let itemStyle = null;
    let applyStyleOnLastItem: boolean;

    if (typeof sizing.gutterSize === 'number') {
      gutterFixed = true;
      itemStyle = {
        marginRight: sizing.gutterSize.toString() + 'px',
      };
      applyStyleOnLastItem = false;
    } else if (typeof sizing.itemSize === 'number') {
      gutterFixed = false;
      itemStyle = {
        width: sizing.itemSize.toString() + 'px',
      };
      applyStyleOnLastItem = true;
    } else {
      invariant(false, 'Either gutter or item size needs to be set');
    }

    return (
      <div
        className={classnames('LayoutGrid-root', this.props.className)}>
        {
          chunks.map((c, idx) =>
            <div key={idx} className="LayoutGrid-row">
              {
                // TODO Pretty sure this wrapper can be removed
                c.map((item, jdx) =>
                  <div
                    key={jdx}
                    className={classnames({'LayoutGrid-cell-gutterFixed': gutterFixed})}
                    style={
                      (!applyStyleOnLastItem && jdx === (c.length - 1))
                        ? null
                        : itemStyle
                    }>
                    {item}
                  </div>
                )
              }
            </div>
          )
        }
      </div>
    );
  }
}
