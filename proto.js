"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Shared = require("./proto/shared_generated");
const ServiceT = require("./proto/service_generated");
const ClientT = require("./proto/client_generated");
const Flatbuffers = require("./proto/flatbuffers");
var Proto;
(function (Proto) {
    Proto.ByteBuffer = Flatbuffers.ByteBuffer;
    Proto.Builder = Flatbuffers.Builder;
    Proto.Encoding = Flatbuffers.Encoding;
    Proto.Long = Flatbuffers.Long;
    Proto.ExceptionInfo = Shared.WsGw.proto.ExceptionInfo;
    Proto.Service = ServiceT.WsGw.proto.Service;
    Proto.Client = ClientT.WsGw.proto.Client;
})(Proto || (Proto = {}));
exports.default = Proto;
