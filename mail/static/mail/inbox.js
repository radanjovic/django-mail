document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // Adding one more event listener for submiting the form for sending emails
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-mail').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email(event) {
  // to prevent default, we must use this (return false didn't work for some reason)
  event.preventDefault();

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-mail').style.display = 'none';


  // Get inputs
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Sending mail via fetch(post)
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: `${recipients}`,
      subject: `${subject}`,
      body: `${body}`
    })
  })
  .then(response => load_mailbox('sent')); // loading sent when done
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-mail').style.display = 'none';

  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // If the mailbox is sent, we want to display the recipients of mails
  if (mailbox === "sent") {
    fetch('emails/sent').then(response => response.json()).then(emails => {
      // Looping trough all emails we got as response
      emails.forEach(email => {
        // Creating new div to display email and adding class for styling later
        const div = document.createElement('div');
        div.className = "emails_view";
        // Populating div
        div.innerHTML = `<span class="emails_SandR">To: <strong>${email.recipients}</strong></span>
                         <span class="emails_subject">${email.subject}</span>
                         <small class="emails_timestamp">${email.timestamp}</small>`;
        // Adding event for each click on the mail to take us to read mail function
        div.addEventListener('click', function() {
          read_mail(email.id);
        });
        // Appending div to email-views - making it visible
        document.querySelector('#emails-view').appendChild(div);
      })
    });
  }

  // But if the mailbox is inbox or archive, we want to show the sender of the email.
  // Also we want to be able to separate read and not read mails here.
  else {
    fetch(`emails/${mailbox}`).then(response => response.json()).then(emails => {
      // Looping trough all emails we got as response
      emails.forEach(email => {
        // Creating new div to display basic email props and adding class for styling later
        const div = document.createElement('div');
        div.className = "emails_view";
        // Populating div
        div.innerHTML = `<span class="emails_SandR">From: <strong>${email.sender}</strong></span>
                         <span class="emails_subject">${email.subject}</span>
                         <small class="emails_timestamp">${email.timestamp}</small>`;
        // Adding event for each click on the mail to take us to read mail function
        div.addEventListener('click', function() {
          read_mail(email.id);
        });
        // If email has been read, changing the background to grey
        if (mailbox === "inbox" && email.read === true) {
          div.style.backgroundColor = "lightgrey";
        }
        // Appending div to email-views - making it visible
        document.querySelector('#emails-view').appendChild(div);
      })
    });
  }
}

function read_mail(id) {

  // First change the email's read to true
  fetch(`emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({ read: true})
  })

  // Then fetch the mail contents
  fetch(`emails/${id}`).then(response => response.json()).then(email => {

    // Here we first want to hide the all mails and compose views, and only 
    // display this particular mail.
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-mail').style.display = 'block';

    // Creating new variable to pass our div read-mail in
    const div = document.querySelector('#read-mail');
    // Populating div
    div.innerHTML = `<div><strong>From: </strong>${email.sender}</div>
                     <div><strong>To: </strong>${email.recipients}</div
                     <div><strong>Timestamp: </strong>${email.timestamp}</div>
                     <br><br>
                     <h5 class="email_subject"><strong>Subject: </strong>${email.subject}</h5>
                     <br>
                     <p class="email_body">${email.body}</p>`;

    // Creating reply button, pre-populated by the emails content
    const reply_button = document.createElement('button');
    // Adding id and class for styling
    reply_button.id = "reply_button";
    reply_button.className = "btn btn-primary";
    reply_button.innerHTML = "Reply";
    // Upon clicking on reply, we want a function that sends us to
    // compose email, but with prefilled other elements.
    reply_button.addEventListener('click', function () {
      compose_email();
      // Since all the other elements (rec, subj and body) are, by default
      // an empty string, we populate them here, with new values:
      // Recipient is always the same - it's the sender of this email that
      // we are currently viewing
      document.querySelector('#compose-recipients').value = email.sender
      // Subject is also the same, but it starts with Re:; if Re is already there,
      // no repeating
      if (email.subject.startsWith("Re: ", 0)) {
        document.querySelector('#compose-subject').value = email.subject;
      }
      else {
        document.querySelector('#compose-subject').value = "Re: " + email.subject;
      }
      // Finally, body should start with on {date} {sender} wrote {body}:
      document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: \n${email.body} \n\n`;
    });
    // Appending reply button
    div.appendChild(reply_button);

    // Creating the archive button - for archieving the mail.
    const archive_button = document.createElement('button');
    // Adding id and class for styling
    archive_button.id = "archive_button";
    archive_button.className = "btn btn-danger";
    // If the mail is not archived - the button should say archive,
    // else unarchive
    if (!email.archived) {
      archive_button.innerHTML = "Archive";
    }
    else {
      archive_button.innerHTML = "Unarchive";
    }
    // When button is clicked, mail is archived/unarchived:
    archive_button.addEventListener('click', function() {
      if (!email.archived) {
        fetch(`emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: true})
        }).then(response => load_mailbox('inbox')) // when done load inbox
      }
      else {
        fetch(`emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: false})
        }).then(response => load_mailbox('inbox')) // when done load inbox
      }
    });
    // Appending the archive button
    div.appendChild(archive_button)
  });
}


