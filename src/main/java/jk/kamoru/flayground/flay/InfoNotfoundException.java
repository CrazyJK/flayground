package jk.kamoru.flayground.flay;

import jk.kamoru.flayground.FlaygroundApplication;

public class InfoNotfoundException extends RuntimeException {

	private static final long serialVersionUID = FlaygroundApplication.SERIAL_VERSION_UID;

	public InfoNotfoundException(Object key) {
		super(key.toString());
	}

}
