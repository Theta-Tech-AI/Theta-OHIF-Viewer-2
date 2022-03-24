import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { ImageThumbnail } from '@ohif/ui';
import classNames from 'classnames';
import { Icon, Tooltip, OverlayTrigger } from '@ohif/ui';
import cornerstone from 'cornerstone-core';

import './XNATThumbnail.styl';

function ThumbnailFooter({
  SeriesDescription,
  SeriesNumber,
  InstanceNumber,
  numImageFrames,
  hasWarnings,
  hasRois,
  imageId,
}) {
  const [inconsistencyWarnings, inconsistencyWarningsSet] = useState([]);

  useEffect(() => {
    let unmounted = false;
    hasWarnings.then(response => {
      if (!unmounted) {
        inconsistencyWarningsSet(response);
      }
    });
    return () => {
      unmounted = true;
    };
  }, []);

  const [xnatRois, setXnatRois] = useState({});

  useEffect(() => {
    let unmounted = false;
    if (hasRois) {
      hasRois.then(response => {
        const SeriesInstanceUID = cornerstone.metaData.get('SeriesInstanceUID', imageId);
        if (response[SeriesInstanceUID]) {
          setXnatRois(response[SeriesInstanceUID]);
        }
      });
    }
    return () => {
      unmounted = true;
    };
  }, [hasRois]);

  const infoOnly = !SeriesDescription;

  const getInfo = (value, icon, className = '') => {
    return (
      <div className={classNames('item item-series', className)}>
        <div className="icon">{icon}</div>
        <div className="value">{value}</div>
      </div>
    );
  };

  const getWarningContent = (inconsistencyWarnings) => {
    if (Array.isArray(inconsistencyWarnings)) {
      const listedWarnings = inconsistencyWarnings.map((warn, index) => {
        return <li key={index}>{warn}</li>;
      });

      return <ol>{listedWarnings}</ol>;
    } else {
      return <React.Fragment>{inconsistencyWarnings}</React.Fragment>;
    }
  };

  const getWarningInfo = (SeriesNumber, inconsistencyWarnings) => {
    return (
      <React.Fragment>
        {inconsistencyWarnings && inconsistencyWarnings.length != 0 ? (
          <OverlayTrigger
            key={SeriesNumber}
            placement="left"
            overlay={
              <Tooltip
                placement="left"
                className="in tooltip-warning"
                id="tooltip-left"
              >
                <div className="warningTitle">Series Inconsistencies</div>
                <div className="warningContent">{getWarningContent(inconsistencyWarnings)}</div>
              </Tooltip>
            }
          >
            <div className={classNames('warning')}>
              <span className="warning-icon">
                <Icon name="exclamation-triangle" />
              </span>
            </div>
          </OverlayTrigger>
        ) : (
          <React.Fragment></React.Fragment>
        )}
      </React.Fragment>
    );
  };

  const getXnatRois = (xnatRois) => {
    const { RTS, SEG } = xnatRois;

    if (!RTS && !SEG) {
      return null;
    }

    const hasRts = RTS.length > 0;
    const hasSeg = SEG.length > 0;

    return (
      <div className="series-information">
        {hasRts && (
          <div className="item item-series">
            <Icon
              name="xnat-contour"
              width="14"
              height="14"
              className="icon roi"
            />
            <div className="value roi">{RTS.length}</div>
          </div>
        )}
        {hasSeg && (
          <div className="item item-series" style={{ marginLeft: RTS ? 5 : 0 }}>
            <Icon
              name="xnat-mask"
              width="14"
              height="14"
              className="icon roi"
            />
            <div className="value roi">{SEG.length}</div>
          </div>
        )}
      </div>
    );
  };

  const getSeriesInformation = (
    SeriesNumber,
    InstanceNumber,
    numImageFrames,
    inconsistencyWarnings
  ) => {
    if (!SeriesNumber && !InstanceNumber && !numImageFrames) {
      return;
    }

    return (
      <div className="series-information">
        {getInfo(SeriesNumber, 'S:')}
        {/*{getInfo(InstanceNumber, 'I:')}*/}
        {getInfo(numImageFrames, '', 'image-frames')}
        {getXnatRois(xnatRois)}
        {getWarningInfo(SeriesNumber, inconsistencyWarnings)}
      </div>
    );
  };

  return (
    <div className={classNames('series-details', { 'info-only': infoOnly })}>
      <div className="series-description">{SeriesDescription}</div>
      {getSeriesInformation(SeriesNumber, InstanceNumber, numImageFrames, inconsistencyWarnings)}
    </div>
  );
}

function XNATThumbnail(props) {
  const {
    active,
    altImageText,
    error,
    displaySetInstanceUID,
    imageId,
    imageSrc,
    InstanceNumber,
    numImageFrames,
    SeriesDescription,
    SeriesNumber,
    hasWarnings,
    stackPercentComplete,
    StudyInstanceUID,
    onClick,
    onDoubleClick,
    onMouseDown,
    supportsDrag,
  } = props;

  const [collectedProps, drag, dragPreview] = useDrag({
    // `droppedItem` in `dropTarget`
    // The only data it will have access to
    item: {
      StudyInstanceUID,
      displaySetInstanceUID,
      type: 'thumbnail', // Has to match `dropTarget`'s type
    },
    canDrag: function(monitor) {
      return supportsDrag;
    },
  });

  const hasImage = imageSrc || imageId;
  const hasAltText = altImageText !== undefined;

  return (
    <div
      ref={drag}
      className={classNames('thumbnail', { active: active })}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {/* SHOW IMAGE */}
      {hasImage && (
        <ImageThumbnail
          active={active}
          imageSrc={imageSrc}
          imageId={imageId}
          error={error}
          stackPercentComplete={stackPercentComplete}
        />
      )}
      {/* SHOW TEXT ALTERNATIVE */}
      {!hasImage && hasAltText && (
        <div className={'alt-image-text p-x-1'}>
          <h1>{altImageText}</h1>
        </div>
      )}
      {ThumbnailFooter(props)}
    </div>
  );
}

const noop = () => {};

XNATThumbnail.propTypes = {
  supportsDrag: PropTypes.bool,
  id: PropTypes.string.isRequired,
  displaySetInstanceUID: PropTypes.string.isRequired,
  StudyInstanceUID: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  error: PropTypes.bool,
  active: PropTypes.bool,
  stackPercentComplete: PropTypes.number,
  /**
  altImageText will be used when no imageId or imageSrc is provided.
  It will be displayed inside the <div>. This is useful when it is difficult
  to make a preview for a type of DICOM series (e.g. DICOM-SR)
  */
  altImageText: PropTypes.string,
  SeriesDescription: PropTypes.string,
  SeriesNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  InstanceNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hasWarnings: PropTypes.instanceOf(Promise),
  numImageFrames: PropTypes.number,
  onDoubleClick: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
};

XNATThumbnail.defaultProps = {
  supportsDrag: false,
  active: false,
  error: false,
  stackPercentComplete: 0,
  onDoubleClick: noop,
  onClick: noop,
  onMouseDown: noop,
};

export { XNATThumbnail };