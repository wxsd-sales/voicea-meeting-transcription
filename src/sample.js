var meetingId = JSON.parse(cache.currentMeetingInfo.data_json).webex.id;

var webexMeetingObj = Object.values(webex.meetings.meetingCollection.meetings).find(element => element.meetingInfo.globalMeetingId === meetingId);

var deviceUrl = webexMeetingObj.deviceUrl;
var datachannelUrl = webexMeetingObj.locusInfo.info.datachannelUrl;

 
function subscribeToWebsocketVoicea(webSocketUrl) {
	let myToken = 'myToken'
	var socket = new WebSocket(webSocketUrl + '?outboundWireFormat=text&bufferStates=true&aliasHttpStatus=true');
	cache.voiceaSocket = socket;
	
	// Open the socket
	socket.onopen = function(event) {
		// Send an initial message
		socket.send(JSON.stringify({
			id: createUuidV4(),
			type: "authorization",
			data: { "token": "Bearer " + glUserWebexToken },
			trackingId:webex.sessionId + Date.now().toString()
		}));

		// Listen for messages
		socket.onmessage = function(event) {
		  console.log('Client received a message', event);
		  var messageData = JSON.parse(event.data);
		  showUserVoiceaText(messageData);
		  placeTranscriptInAgenda(messageData);
		  socket.send(JSON.stringify({"messageId": messageData.id, "type": "ack"}));
		};

		// Listen for socket closes
		socket.onclose = function(event) {
		  console.log('Client notified socket has closed', event);
		};
	};
}


function showUserVoiceaText(messageData) {
	var inData = messageData.data;
	if(typeof(inData.voiceaPayload) !== 'undefined') {
		console.log(inData.voiceaPayload.type, inData);
		if(typeof(inData.voiceaPayload.data) !== 'undefined') {
			if(inData.voiceaPayload.type === 'transcript_final_result') {
				var displayText = inData.voiceaPayload.data;
				insertClosedCaptionsText(displayText);
			}
		}
	}
}

function placeTranscriptInAgenda(messageData) {
	var inData = messageData.data;
	if(typeof(inData.voiceaPayload) !== 'undefined' && typeof(inData.voiceaPayload.transcript_id) !== 'undefined') {
		var payload = messageData.data.voiceaPayload;
		var existingDomItem = $('.davra-list-proceedings-outer #' + payload.transcript_id);
		console.log('placeTranscriptInAgenda ', existingDomItem.length, payload.transcript_id, payload);
		if(existingDomItem.length > 0) {
			existingDomItem.text(payload.data); 
		} else {
			$('.davra-list-proceedings-outer').append('<div id="'  + payload.transcript_id + '">'
			+ payload.data + '</div>');
		}
	}
}


// POST TO REGISTRATION URL
$.ajax({
    type: "POST",
    data: JSON.stringify({ "deviceUrl": deviceUrl }),
    json: true,
    contentType: "application/json",
    dataType: "json",
    url: datachannelUrl,
    beforeSend: function (request) {
      request.setRequestHeader("Authorization", "Bearer " + glUserWebexToken);
    },
    success: function (response) {
      console.log('ajaxWebexPost', JSON.stringify(response, null, 4));
	  subscribeToWebsocketVoicea(response.webSocketUrl);
    },
    error: function (err) {
      console.log('Error ajaxWebexPost', err);
    }
 });