using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class idioma : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton5")]
	private RadioButton _RadioButton5;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton4")]
	private RadioButton _RadioButton4;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton3")]
	private RadioButton _RadioButton3;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton2")]
	private RadioButton _RadioButton2;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton1")]
	private RadioButton _RadioButton1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	private ResourceManager RM;

	private string m_idioma;

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual RadioButton RadioButton5
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton5;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton5_CheckedChanged;
			RadioButton radioButton = _RadioButton5;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton5 = value;
			radioButton = _RadioButton5;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual RadioButton RadioButton4
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton4_CheckedChanged;
			RadioButton radioButton = _RadioButton4;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton4 = value;
			radioButton = _RadioButton4;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual RadioButton RadioButton3
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton3_CheckedChanged;
			RadioButton radioButton = _RadioButton3;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton3 = value;
			radioButton = _RadioButton3;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual RadioButton RadioButton2
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton2_CheckedChanged;
			RadioButton radioButton = _RadioButton2;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton2 = value;
			radioButton = _RadioButton2;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual RadioButton RadioButton1
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton1_CheckedChanged;
			RadioButton radioButton = _RadioButton1;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton1 = value;
			radioButton = _RadioButton1;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button2
	{
		[CompilerGenerated]
		get
		{
			return _Button2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button2_Click;
			Button button = _Button2;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button2 = value;
			button = _Button2;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	public idioma()
	{
		base.Load += idioma_Load;
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
		m_idioma = "";
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager componentResourceManager = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.idioma));
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.RadioButton5 = new System.Windows.Forms.RadioButton();
		this.RadioButton4 = new System.Windows.Forms.RadioButton();
		this.RadioButton3 = new System.Windows.Forms.RadioButton();
		this.RadioButton2 = new System.Windows.Forms.RadioButton();
		this.RadioButton1 = new System.Windows.Forms.RadioButton();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.GroupBox1.SuspendLayout();
		base.SuspendLayout();
		componentResourceManager.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Controls.Add(this.RadioButton5);
		this.GroupBox1.Controls.Add(this.RadioButton4);
		this.GroupBox1.Controls.Add(this.RadioButton3);
		this.GroupBox1.Controls.Add(this.RadioButton2);
		this.GroupBox1.Controls.Add(this.RadioButton1);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		componentResourceManager.ApplyResources(this.RadioButton5, "RadioButton5");
		this.RadioButton5.Name = "RadioButton5";
		this.RadioButton5.TabStop = true;
		this.RadioButton5.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.RadioButton4, "RadioButton4");
		this.RadioButton4.Name = "RadioButton4";
		this.RadioButton4.TabStop = true;
		this.RadioButton4.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.RadioButton3, "RadioButton3");
		this.RadioButton3.Name = "RadioButton3";
		this.RadioButton3.TabStop = true;
		this.RadioButton3.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.RadioButton2, "RadioButton2");
		this.RadioButton2.Name = "RadioButton2";
		this.RadioButton2.TabStop = true;
		this.RadioButton2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.RadioButton1, "RadioButton1");
		this.RadioButton1.Name = "RadioButton1";
		this.RadioButton1.TabStop = true;
		this.RadioButton1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.GroupBox1);
		base.Name = "idioma";
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		base.ResumeLayout(false);
	}

	private void RadioButton3_CheckedChanged(object sender, EventArgs e)
	{
		if (RadioButton3.Checked)
		{
			RadioButton1.Checked = false;
			RadioButton2.Checked = false;
			RadioButton4.Checked = false;
			RadioButton5.Checked = false;
			m_idioma = "de-DE";
		}
	}

	private void RadioButton1_CheckedChanged(object sender, EventArgs e)
	{
		if (RadioButton1.Checked)
		{
			RadioButton2.Checked = false;
			RadioButton3.Checked = false;
			RadioButton4.Checked = false;
			RadioButton5.Checked = false;
			m_idioma = "es-ES";
		}
	}

	private void RadioButton2_CheckedChanged(object sender, EventArgs e)
	{
		if (RadioButton2.Checked)
		{
			RadioButton1.Checked = false;
			RadioButton3.Checked = false;
			RadioButton4.Checked = false;
			RadioButton5.Checked = false;
			m_idioma = "en-US";
		}
	}

	private void RadioButton4_CheckedChanged(object sender, EventArgs e)
	{
		if (RadioButton4.Checked)
		{
			RadioButton1.Checked = false;
			RadioButton2.Checked = false;
			RadioButton3.Checked = false;
			RadioButton5.Checked = false;
			m_idioma = "fr-FR";
		}
	}

	private void RadioButton5_CheckedChanged(object sender, EventArgs e)
	{
		if (RadioButton5.Checked)
		{
			RadioButton1.Checked = false;
			RadioButton2.Checked = false;
			RadioButton3.Checked = false;
			RadioButton4.Checked = false;
			m_idioma = "it-IT";
		}
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		MySettingsProperty.Settings.idioma = m_idioma;
		MySettingsProperty.Settings.Save();
		Thread.Sleep(1000);
		if (Interaction.MsgBox(RM.GetString("reiniciar"), MsgBoxStyle.OkCancel) == MsgBoxResult.Ok)
		{
			MySettingsProperty.Settings.Save();
			Application.Restart();
		}
		else
		{
			Close();
		}
	}

	private void idioma_Load(object sender, EventArgs e)
	{
		switch (MySettingsProperty.Settings.idioma)
		{
		case "es-ES":
			RadioButton1.Checked = true;
			break;
		case "en-US":
			RadioButton2.Checked = true;
			break;
		case "de-DE":
			RadioButton3.Checked = true;
			break;
		case "fr-FR":
			RadioButton4.Checked = true;
			break;
		default:
			RadioButton5.Checked = true;
			break;
		}
	}
}
