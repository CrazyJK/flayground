package jk.kamoru.flayground.flay.source;

import jk.kamoru.flayground.FlaygroundApplication;

public class InfoNotfoundException extends RuntimeException {

	private static final long serialVersionUID = FlaygroundApplication.SERIAL_VERSION_UID;

	public InfoNotfoundException(long id) {
		super("" + id);
	}

}
