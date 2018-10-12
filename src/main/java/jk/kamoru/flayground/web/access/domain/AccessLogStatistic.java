package jk.kamoru.flayground.web.access;

import java.io.Serializable;

import javax.persistence.Entity;
import javax.persistence.Id;

import jk.kamoru.flayground.FlaygroundApplication;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class AccessLogStatistic implements Serializable {

	private static final long serialVersionUID = FlaygroundApplication.SERIAL_VERSION_UID;
	
	@Id
    public String handlerInfo;
    public long callCount;

	public AccessLogStatistic(String handlerInfo) {
		this.handlerInfo = handlerInfo;
	}

	public void increaseCallCount() {
		++callCount;
	}

}