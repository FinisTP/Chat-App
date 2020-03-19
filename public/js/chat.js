const socket = io();

// Elements
const $messageForm = document.querySelector('#chat-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $shareLocationButton = document.querySelector('#share-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (msg) => {
    console.log('====================================');
    console.log(msg);
    console.log('====================================');

    const html = Mustache.render(messageTemplate, {
        message: msg.msg,
        createdAt: moment(msg.createdAt).format('hh:mm A'),
        username: msg.username
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (url) => {
    console.log('====================================');
    console.log(url);
    console.log('====================================');

    const html = Mustache.render(locationTemplate, {
        url: url.url,
        createdAt: moment(url.createdAt).format('hh:mm A'),
        username: url.username
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;;
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // Disable the form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = event.target.elements.message.value;
    socket.emit('updateMessage', msg, (error) => {
        //Reenable the form
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }

        console.log("The message was delivered");
    });

})

document.querySelector('#share-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position.coords);
        $shareLocationButton.setAttribute('disabled', 'disabled');
        socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            (error) => {
                $shareLocationButton.removeAttribute('disabled')
                if (error)
                    return console.log(error)
                console.log("Your location has been shared!");
            });

    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});