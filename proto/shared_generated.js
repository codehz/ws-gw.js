"use strict";
// automatically generated by the FlatBuffers compiler, do not modify
Object.defineProperty(exports, "__esModule", { value: true });
const flatbuffers = require("./flatbuffers");
/**
 * @constructor
 */
var WsGw;
(function (WsGw) {
    var proto;
    (function (proto) {
        class ExceptionInfo {
            constructor() {
                this.bb = null;
                this.bb_pos = 0;
            }
            /**
             * @param number i
             * @param flatbuffers.ByteBuffer bb
             * @returns ExceptionInfo
             */
            __init(i, bb) {
                this.bb_pos = i;
                this.bb = bb;
                return this;
            }
            ;
            /**
             * @param flatbuffers.ByteBuffer bb
             * @param ExceptionInfo= obj
             * @returns ExceptionInfo
             */
            static getRootAsExceptionInfo(bb, obj) {
                return (obj || new ExceptionInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
            }
            ;
            /**
             * @param flatbuffers.ByteBuffer bb
             * @param ExceptionInfo= obj
             * @returns ExceptionInfo
             */
            static getSizePrefixedRootAsExceptionInfo(bb, obj) {
                bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
                return (obj || new ExceptionInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
            }
            ;
            message(optionalEncoding) {
                var offset = this.bb.__offset(this.bb_pos, 4);
                return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
            }
            ;
            /**
             * @param flatbuffers.Builder builder
             */
            static startExceptionInfo(builder) {
                builder.startObject(1);
            }
            ;
            /**
             * @param flatbuffers.Builder builder
             * @param flatbuffers.Offset messageOffset
             */
            static addMessage(builder, messageOffset) {
                builder.addFieldOffset(0, messageOffset, 0);
            }
            ;
            /**
             * @param flatbuffers.Builder builder
             * @returns flatbuffers.Offset
             */
            static endExceptionInfo(builder) {
                var offset = builder.endObject();
                builder.requiredField(offset, 4); // message
                return offset;
            }
            ;
            static createExceptionInfo(builder, messageOffset) {
                ExceptionInfo.startExceptionInfo(builder);
                ExceptionInfo.addMessage(builder, messageOffset);
                return ExceptionInfo.endExceptionInfo(builder);
            }
        }
        proto.ExceptionInfo = ExceptionInfo;
    })(proto = WsGw.proto || (WsGw.proto = {}));
})(WsGw = exports.WsGw || (exports.WsGw = {}));