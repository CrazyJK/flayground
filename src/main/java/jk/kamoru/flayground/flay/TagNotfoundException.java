package jk.kamoru.flayground.flay;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.FlaygroundApplication;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TagNotfoundException extends RuntimeException {

	private static final long serialVersionUID = FlaygroundApplication.SERIAL_VERSION_UID;

	public TagNotfoundException(int id) {
		super("Notfound tag " + id);
	}
}
